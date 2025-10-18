import React from "react";

const SkeletonItem = () => {
  return (
    <div className="relative rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse">
      {/* Popular Badge Skeleton */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-24"></div>
      </div>

      {/* Plan Icon Skeleton */}
      <div className="mb-6 p-3 rounded-xl w-fit bg-gray-300 dark:bg-gray-600">
        <div className="w-6 h-6 bg-gray-400 dark:bg-gray-500 rounded-md"></div>
      </div>

      {/* Plan Header */}
      <div className="mb-6">
        <div className="h-7 bg-gray-300 dark:bg-gray-600 rounded-lg w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mt-2"></div>
      </div>

      {/* Pricing */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <div className="h-9 bg-gray-300 dark:bg-gray-600 rounded-lg w-20"></div>
          <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
        </div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mt-1"></div>
      </div>

      {/* Features List */}
      <div className="space-y-4 mb-8">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0"></div>
            <div
              className="h-4 bg-gray-300 dark:bg-gray-600 rounded flex-1"
              style={{
                width: `${70 + index * 5}%`,
              }}
            ></div>
          </div>
        ))}
      </div>

      {/* CTA Button Skeleton */}
      <div className="w-full h-12 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>

      {/* Shimmer Effect Overlay */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent animate-shimmer"></div>
    </div>
  );
};

export default SkeletonItem;
