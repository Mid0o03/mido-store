import React from 'react';
import './Contact.css';

const Contact = () => {
    return (
        <section id="contact" className="contact-section">
            <div className="container contact-container">
                <div className="contact-info">
                    <h2 className="section-title">Ready to <span className="text-accent">Innovate?</span></h2>
                    <p className="contact-text">
                        Let's build something exceptional together. Tell me about your project, your timeline, and your vision.
                    </p>
                    <div className="contact-email text-accent">hello@mido.dev</div>
                </div>

                <form className="contact-form glass-panel">
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input type="text" id="name" placeholder="John Doe" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" placeholder="john@example.com" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="message">Project Details</label>
                        <textarea id="message" rows="4" placeholder="I need a high-performance website..."></textarea>
                    </div>
                    <button type="submit" className="submit-btn">Send Proposal</button>
                </form>
            </div>
            <footer className="footer text-center">
                <p>© 2026 Mido. All Rights Reserved.</p>
            </footer>
        </section>
    );
};

export default Contact;
