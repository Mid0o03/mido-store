-- Migration: Sales Analytics
-- Defines a secure RPC function to fetch aggregated sales data for the Admin Dashboard.

-- 1. Create the aggregated stats function
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of creator (admin), allows bypassing RLS for aggregation
AS $$
DECLARE
    total_revenue NUMERIC;
    total_sales INTEGER;
    recent_transactions JSONB;
    daily_sales JSONB;
    current_user_email TEXT;
BEGIN
    -- Security Check: Limit to Admin Emails
    -- (This assumes specific emails are admins. In production, check a 'roles' table)
    SELECT email INTO current_user_email FROM auth.users WHERE id = auth.uid();
    
    IF current_user_email NOT IN ('admin@mido.com', 'midodev.fr@gmail.com') THEN
        RAISE EXCEPTION 'Access Denied: Admin privileges required.';
    END IF;

    -- 1. Total Revenue
    SELECT COALESCE(SUM(price_paid), 0) INTO total_revenue FROM purchases;

    -- 2. Total Sales Count
    SELECT COUNT(*) INTO total_sales FROM purchases;

    -- 3. Recent 5 Transactions
    SELECT jsonb_agg(t) INTO recent_transactions
    FROM (
        SELECT 
            id,
            template_title, 
            price_paid, 
            created_at,
            user_id
        FROM purchases
        ORDER BY created_at DESC
        LIMIT 5
    ) t;

    -- 4. Daily Sales (Last 30 Days) for Chart
    SELECT jsonb_agg(d) INTO daily_sales
    FROM (
        SELECT 
            TO_CHAR(created_at, 'YYYY-MM-DD') as date,
            COUNT(*) as count,
            SUM(price_paid) as total
        FROM purchases
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY 1
        ORDER BY 1 ASC
    ) d;

    -- Return combined JSON
    RETURN jsonb_build_object(
        'total_revenue', total_revenue,
        'total_sales', total_sales,
        'recent_sales', COALESCE(recent_transactions, '[]'::jsonb),
        'sales_by_date', COALESCE(daily_sales, '[]'::jsonb)
    );
END;
$$;

-- 2. Grant execution permission to authenticated users
-- (The internal check handles role security, but they need permission to call the RPC)
GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;
