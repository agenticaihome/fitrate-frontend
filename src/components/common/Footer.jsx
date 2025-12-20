import React from 'react';

const Footer = ({ className = '' }) => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={`w-full py-8 mt-auto text-center ${className}`}>
            <div className="flex justify-center gap-6 mb-3">
                <a href="/terms.html" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Terms</a>
                <a href="/privacy.html" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Privacy</a>
                <a href="mailto:support@fitrate.app" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Support</a>
            </div>
            <p className="text-[10px] text-gray-600">
                © {currentYear} FitRate. All rights reserved.
            </p>
        </footer>
    );
};

export default Footer;
