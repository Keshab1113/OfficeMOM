import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const Breadcrumb = ({ items }) => {
  return (
    <nav className=" absolute top-6 left-10 md:flex hidden items-center space-x-1 text-sm text-gray-600 dark:text-gray-300 mb-6">
      <Link 
        to="/" 
        className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <Home className="w-4 h-4 mr-1" />
        Home
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {item.href && index < items.length - 1 ? (
            <Link 
              to={item.href} 
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={`${index === items.length - 1 ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}`}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;