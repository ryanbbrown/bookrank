import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';

interface MultiSelectProps {
    options: string[];
    selectedOptions: string[];
    onChange: (selected: string[]) => void;
    label: string;
}

export function MultiSelect({ options, selectedOptions, onChange, label }: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (option: string) => {
        const newSelected = selectedOptions.includes(option)
            ? selectedOptions.filter(item => item !== option)
            : [...selectedOptions, option];
        onChange(newSelected);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2"
            >
                {label} ({selectedOptions.length})
                <span className="ml-2">▼</span>
            </Button>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-48 bg-white border rounded-md shadow-lg">
                    <div className="p-2">
                        {options.map(option => (
                            <label key={option} className="flex items-center p-2 hover:bg-gray-100">
                                <input
                                    type="checkbox"
                                    checked={selectedOptions.includes(option)}
                                    onChange={() => toggleOption(option)}
                                    className="mr-2"
                                />
                                {option}
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
} 