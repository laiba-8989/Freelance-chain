import React from 'react';
import Avatar from './Avatar';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const UserCard = ({
  user,
  selected = false,
  onClick,
  lastMessage,
  timestamp,
  unreadCount = 0,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center p-3 gap-3 cursor-pointer rounded-lg transition-colors duration-200',
        'border border-transparent hover:border-gray-200',
        selected ? 'bg-primary/10 border-primary/20' : 'hover:bg-gray-50',
        className
      )}
      onClick={onClick}
    >
      <Link 
        to={`/profile/public/${user._id}`}
        className="relative shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <Avatar 
          src={user.profileImage ? `${API_URL}${user.profileImage}` : undefined} 
          alt={user.name || 'User'} 
          className="w-10 h-10"
        />
        {/* Online status indicator */}
        {user.status === 'online' && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        )}
      </Link>
      
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex justify-between items-baseline gap-2">
          <Link 
            to={`/profile/public/${user._id}`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "font-heading text-sm md:text-base truncate hover:underline",
              selected ? "text-accent font-bold" : "text-gray-800 font-medium"
            )}
          >
            {user.name || 'Unknown User'}
          </Link>
          {timestamp && (
            <span className={cn(
              "text-xs shrink-0",
              selected ? "text-primary" : "text-gray-500"
            )}>
              {timestamp}
            </span>
          )}
        </div>
        
        {lastMessage && (
          <p className={cn(
            "font-body text-sm truncate",
            selected ? "text-primary" : "text-gray-500"
          )}>
            {lastMessage}
          </p>
        )}
      </div>
      
      {unreadCount > 0 && (
        <div className={cn(
          "bg-primary text-white text-xs font-bold rounded-full",
          "w-5 h-5 flex items-center justify-center shrink-0",
          "transition-all duration-200 transform",
          unreadCount > 9 ? "px-1" : ""
        )}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </div>
  );
};

export default UserCard;
