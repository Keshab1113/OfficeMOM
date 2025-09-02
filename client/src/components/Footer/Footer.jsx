import { useState, useEffect } from "react";
import {Link} from "react-router-dom"

const Footer = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.1 }
        );

        const footerElement = document.getElementById('animated-footer');
        if (footerElement) {
            observer.observe(footerElement);
        }

        return () => {
            if (footerElement) {
                observer.unobserve(footerElement);
            }
        };
    }, []);

    const footerLinks = {
        product: [
            { name: "Features", href: "/" },
            { name: "Pricing", href: "/" },
            { name: "Integrations", href: "/" },
            { name: "API", href: "/" }
        ],
        company: [
            { name: "About", href: "/about-us" },
            { name: "Blog", href: "/" },
            { name: "Careers", href: "/" },
            { name: "Contact", href: "/" }
        ],
        support: [
            { name: "Help Center", href: "/" },
            { name: "Documentation", href: "/" },
            { name: "Privacy Policy", href: "/" },
            { name: "Terms of Service", href: "/" }
        ]
    };

    return (
        <footer 
            id="animated-footer"
            className="relative dark:bg-[linear-gradient(135deg,#06080D_0%,#0D121C_50%,#1A1F2E_100%)] bg-[linear-gradient(135deg,white_0%,#d3e4f0_50%,#b8d4e8_100%)] text-white py-16 md:w-full w-screen border-t border-white/20 overflow-hidden"
        >
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-gradient-to-r from-teal-400/20 to-blue-400/20 rounded-full blur-2xl animate-pulse delay-500"></div>
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-blue-400/60 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 2}s`
                        }}
                    ></div>
                ))}
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`grid md:grid-cols-4 gap-8 transition-all duration-1000 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}>
                    {/* Brand Section */}
                    <div className="transform transition-all duration-700 hover:scale-105 hover:-translate-y-2">
                        <div className="flex items-center space-x-3 mb-6 group">
                            <div className="relative w-10 h-10 bg-gradient-to-br from-white to-blue-400 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-400/25 transition-all duration-300 group-hover:rotate-12">
                                <div className="absolute inset-0 bg-gradient-to-br from-white to-blue-400 rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
                                <img src="/logo.webp" alt="logo" loading="lazy" className="relative z-10 w-6 h-6"/>
                            </div>
                            <span className="text-3xl font-bold dark:text-white text-[#06304f] group-hover:text-blue-400 transition-colors duration-300">
                                Office<span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">MoM</span>
                            </span>
                        </div>
                        <p className="dark:text-gray-300 text-[#06304f] leading-relaxed text-lg hover:text-blue-300 transition-colors duration-300">
                            Automate meeting minutes seamlessly with AI-powered transcription and smart formatting.
                        </p>
                    </div>

                    {/* Product Links */}
                    <div className={`transition-all duration-700 delay-200 ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}>
                        <h3 className="font-bold mb-6 dark:text-white text-[#06304f] text-xl relative">
                            Product
                            <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-blue-400 to-transparent"></div>
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link, index) => (
                                <li key={index} className="transform transition-all duration-300 hover:translate-x-2">
                                    <Link 
                                        to={link.href} 
                                        className="dark:text-gray-300 text-[#06304f] dark:hover:text-blue-400 hover:text-blue-600 transition-all duration-300 relative group text-lg"
                                    >
                                        {link.name}
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div className={`transition-all duration-700 delay-300 ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}>
                        <h3 className="font-bold mb-6 dark:text-white text-[#06304f] text-xl relative">
                            Company
                            <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-indigo-400 to-transparent"></div>
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link, index) => (
                                <li key={index} className="transform transition-all duration-300 hover:translate-x-2">
                                    <Link 
                                        to={link.href} 
                                        className="dark:text-gray-300 text-[#06304f] dark:hover:text-indigo-400 hover:text-indigo-600 transition-all duration-300 relative group text-lg"
                                    >
                                        {link.name}
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div className={`transition-all duration-700 delay-500 ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}>
                        <h3 className="font-bold mb-6 dark:text-white text-[#06304f] text-xl relative">
                            Support
                            <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-purple-400 to-transparent"></div>
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.support.map((link, index) => (
                                <li key={index} className="transform transition-all duration-300 hover:translate-x-2">
                                    <Link 
                                        to={link.href} 
                                        className="dark:text-gray-300 text-[#06304f] dark:hover:text-purple-400 hover:text-purple-600 transition-all duration-300 relative group text-lg"
                                    >
                                        {link.name}
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-400 transition-all duration-300 group-hover:w-full"></span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className={`relative mt-16 pt-8 text-center transition-all duration-1000 delay-700 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}>
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
                    <p className="dark:text-gray-300 text-[#06304f] text-lg hover:text-blue-400 transition-colors duration-300">
                        &copy; 2025 <span className="font-semibold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">OfficeMoM</span>, a subsidiary of <span className="font-semibold">QuantumHash Corporation</span>. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Bottom glow effect */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
        </footer>
    );
};

export default Footer;