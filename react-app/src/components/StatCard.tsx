import React from 'react';
import { Card, CardContent } from './ui/card';
import { Link } from 'react-router-dom';

interface StatCardProps {
    number: number;
    label: string;
    type?: 'books';
    isLoading?: boolean;
}

function StatCard({ number, label, type, isLoading = false }: StatCardProps) {
    if (isLoading) {
        return (
            <Card className="w-full">
                <CardContent className="pt-6">
                    <div className="flex justify-center items-center h-24">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-800 rounded-full animate-spin"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (type === 'books' && number < 10) {
        return (
            <Card className="w-full">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-teal-800">
                            {number}
                        </div>
                        <div className="text-slate-600 mt-2">
                            {label}
                        </div>
                        <div className="mt-4 text-sm text-slate-600">
                            Need a start? <Link to="/goodreadsimport" className="text-teal-800 underline hover:text-teal-900">Import from Goodreads</Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardContent className="pt-6">
                <div className="text-center">
                    <div className="text-4xl font-bold text-teal-800">
                        {number}
                    </div>
                    <div className="text-slate-600 mt-2">
                        {label}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default StatCard; 