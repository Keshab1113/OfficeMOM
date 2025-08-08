import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer className="bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] text-white py-12 w-screen border-t-[0.1px] border-solid border-white/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-8">
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-r from-white to-blue-400 rounded-lg flex items-center justify-center">
                                <img src="/logo.webp" alt="logo" loading="lazy"/>
                            </div>
                            <span className="text-2xl font-bold">
                                Office<span className="text-blue-400">MoM</span>
                            </span>
                        </div>
                        <p className="text-gray-400">
                            Automate meeting minutes seamlessly with AI-powered transcription and smart formatting.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Product</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li><Link to={"/"} className="hover:text-white transition-colors">Features</Link></li>
                            <li><Link to={"/"} className="hover:text-white transition-colors">Pricing</Link></li>
                            <li><Link to={"/"} className="hover:text-white transition-colors">Integrations</Link></li>
                            <li><Link to={"/"} className="hover:text-white transition-colors">API</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Company</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li><Link to={"/"} className="hover:text-white transition-colors">About</Link></li>
                            <li><Link to={"/"} className="hover:text-white transition-colors">Blog</Link></li>
                            <li><Link to={"/"} className="hover:text-white transition-colors">Careers</Link></li>
                            <li><Link to={"/"} className="hover:text-white transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Support</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li><Link to={"/"} className="hover:text-white transition-colors">Help Center</Link></li>
                            <li><Link to={"/"} className="hover:text-white transition-colors">Documentation</Link></li>
                            <li><Link to={"/"} className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link to={"/"} className="hover:text-white transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                    <p>&copy; 2025 OfficeMoM. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer;