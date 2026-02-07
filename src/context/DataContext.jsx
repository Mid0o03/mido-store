import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    const mockTemplates = [
        {
            id: 1,
            title: "NEON DASHBOARD",
            category: "Web",
            subCategory: "SaaS",
            price: "49€",
            tech: ["React", "Tailwind", "Recharts"],
            image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
            code_snippet: `// NEON DASHBOARD - Main Layout
export const DashboardLayout = ({ children }) => (
  <div className="flex h-screen bg-gray-900 text-white">
    <Sidebar />
    <main className="flex-1 p-6 overflow-y-auto">
      <Header />
      {children}
    </main>
  </div>
);`
        },
        {
            id: 2,
            title: "ZEN PORTFOLIO",
            category: "Web",
            subCategory: "Portfolio",
            price: "29€",
            tech: ["Next.js", "Framer", "MDX"],
            image_url: "https://images.unsplash.com/photo-1517816428104-797678c7cf0c?auto=format&fit=crop&q=80&w=800",
            code_snippet: `// ZEN PORTFOLIO - Hero Component
import { motion } from 'framer-motion';

export const Hero = () => (
  <section className="h-screen flex items-center justify-center">
    <motion.h1 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="text-6xl font-serif"
    >
      Simplicity is the ultimate sophistication.
    </motion.h1>
  </section>
);`
        },
        {
            id: 3,
            title: "CYBER COMMERCE",
            category: "Web",
            subCategory: "E-commerce",
            price: "79€",
            tech: ["Shopify", "Liquid", "GSAP"],
            image_url: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=800"
        },
        {
            id: 4,
            title: "MOBILE BANKING",
            category: "App",
            subCategory: "Mobile UI",
            price: "59€",
            tech: ["React Native", "Expo", "Reanimated"],
            image_url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800"
        },
        {
            id: 5,
            title: "AR CATALOG",
            category: "App",
            subCategory: "AI Interfaces",
            price: "89€",
            tech: ["Unity", "C#", "ARKit"],
            image_url: "https://images.unsplash.com/photo-1592478411213-61535fdd861d?auto=format&fit=crop&q=80&w=800"
        },
        {
            id: 6,
            title: "LANDING PRO",
            category: "Web",
            subCategory: "Landing Page",
            price: "39€",
            tech: ["HTML", "Sass", "JS"],
            image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
        }
    ];

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const { data, error } = await supabase
                .from('templates')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;
            if (data && data.length > 0) {
                setTemplates(data);
            } else {
                setTemplates(mockTemplates);
            }
        } catch (error) {
            console.warn("Supabase not connected. Using mock data.");
            setTemplates(mockTemplates);
        } finally {
            setLoading(false);
        }
    };

    const uploadImage = async (file) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error.message);
            throw error;
        }
    };

    const uploadAsset = async (file) => {
        try {
            // Check file size (500MB limit safety check)
            const MAX_SIZE = 500 * 1024 * 1024; // 500MB
            if (file.size > MAX_SIZE) {
                throw new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Max allowed is 500MB.`);
            }
            console.log(`📤 Uploading asset: ${file.name} Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            // Store in a 'private' folder structure if needed, or root
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // For private buckets, we store the PATH, not the Public URL
            // because we will need to generate signed URLs later.
            // Or we can store the full Signed URL with long expiry? 
            // Better to store path and generate signed URL on demand.
            return filePath;
        } catch (error) {
            console.error('Error uploading asset:', error.message);
            throw error;
        }
    };

    const addTemplate = async (templateData) => {
        try {
            let imageUrl = templateData.image_url;
            let fileUrl = templateData.file_url;

            // Image Upload
            if (templateData.image_file) {
                imageUrl = await uploadImage(templateData.image_file);
            }

            // Asset (ZIP) Upload
            if (templateData.zip_file) {
                fileUrl = await uploadAsset(templateData.zip_file);
            }

            const newTemplate = {
                title: templateData.title,
                category: templateData.category,
                sub_category: templateData.subCategory,
                price: templateData.price,
                tech: templateData.tech,
                image_url: imageUrl,
                file_url: fileUrl,
                demo_url: templateData.demo_url
            };

            const { data, error } = await supabase
                .from('templates')
                .insert([newTemplate])
                .select();

            if (error) throw error;
            if (data) setTemplates([data[0], ...templates]);
            return { success: true };
        } catch (error) {
            console.error("Error adding template:", error.message);
            return { success: false, message: error.message };
        }
    };

    const updateTemplate = async (id, updates) => {
        try {
            let imageUrl = updates.image_url;
            let fileUrl = updates.file_url;

            // Handle new image upload
            if (updates.image_file) {
                imageUrl = await uploadImage(updates.image_file);
            }

            // Handle new zip upload
            if (updates.zip_file) {
                fileUrl = await uploadAsset(updates.zip_file);
            }

            const updatedData = {
                title: updates.title,
                category: updates.category,
                sub_category: updates.subCategory,
                price: updates.price,
                tech: updates.tech,
                image_url: imageUrl,
                file_url: fileUrl,
                demo_url: updates.demo_url,
                status: updates.status,
                is_featured: updates.is_featured
            };

            const { data, error } = await supabase
                .from('templates')
                .update(updatedData)
                .eq('id', id)
                .select();

            if (error) throw error;

            if (data) {
                setTemplates(templates.map(t => t.id === id ? data[0] : t));
            }
            return { success: true };
        } catch (error) {
            console.error("Error updating template:", error.message);
            return { success: false, message: error.message };
        }
    };

    const deleteTemplate = async (id) => {
        try {
            // 1. Get the template to find the image URL
            const templateToDelete = templates.find(t => t.id === id);

            // 2. Try to delete image from storage if it exists
            if (templateToDelete && templateToDelete.image_url) {
                // Check if it's a supabase storage URL
                if (templateToDelete.image_url.includes('product-images')) {
                    try {
                        const urlParts = templateToDelete.image_url.split('/');
                        const fileName = urlParts[urlParts.length - 1];
                        if (fileName) {
                            const { error: storageError } = await supabase
                                .storage
                                .from('product-images')
                                .remove([fileName]);

                            if (storageError) console.warn("Could not delete image file:", storageError);
                        }
                    } catch (err) {
                        console.warn("Error parsing image URL for deletion:", err);
                    }
                }
            }

            // 3. Delete the row
            const { error } = await supabase
                .from('templates')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setTemplates(templates.filter(t => t.id !== id));
            return { success: true };
        } catch (error) {
            console.error("Error deleting template:", error.message);
            return { success: false, message: error.message };
        }
    };

    const incrementViews = async (id) => {
        try {
            const { error } = await supabase.rpc('increment_views', { row_id: id });
            if (error) throw error;

            // Optimistically update local state so we don't need to refetch everything
            setTemplates(prev => prev.map(t =>
                t.id === id ? { ...t, views: (t.views || 0) + 1 } : t
            ));
        } catch (error) {
            console.error("Error incrementing views:", error.message);
        }
    };

    return (
        <DataContext.Provider value={{
            templates,
            loading,
            addTemplate,
            updateTemplate,
            deleteTemplate,
            incrementViews
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
