import React, { useState, useRef, useEffect } from 'react';

interface InputModalProps {
  isOpen: boolean;
  title: string;
  placeholder: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  title,
  placeholder,
  defaultValue = '',
  onConfirm,
  onCancel
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, defaultValue]);

  const handleConfirm = () => {
    if (inputValue.trim()) {
      onConfirm(inputValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onCancel}
    >
      <div 
        className="relative p-6 w-full max-w-md"
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          border: '1px solid var(--sidebar-border)',
          borderRadius: '16px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center mb-4">
          <span
            style={{
              display: 'inline-block',
              width: '3px',
              height: '16px',
              borderRadius: '2px',
              marginRight: '8px',
              background: 'linear-gradient(to bottom, var(--button-primary), #a78bfa)'
            }}
          />
          <h2 
            className="text-lg font-semibold"
            style={{ color: 'var(--app-text)' }}
          >
            {title}
          </h2>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3 outline-none transition-all mb-6"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid var(--sidebar-border)',
            borderRadius: '10px',
            color: 'var(--app-text)'
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.4)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.08)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = '1px solid var(--sidebar-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="transition-colors"
            style={{
              backgroundColor: 'rgba(128, 128, 128, 0.3)',
              color: 'var(--app-text)',
              borderRadius: '8px',
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 500
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.3)';
            }}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="transition-colors"
            style={{
              backgroundColor: 'var(--button-primary)',
              color: 'white',
              borderRadius: '8px',
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--button-primary)';
            }}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputModal;
