import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

function SampleChart() {
    const data = [
        { name: 'A', value: 400 },
        { name: 'B', value: 300 },
        { name: 'C', value: 200 },
        { name: 'D', value: 278 },
        { name: 'E', value: 189 },
    ];

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-center text-xl">Sample Chart</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'white',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    padding: '8px'
                                }}
                                cursor={{ fill: 'rgba(14, 116, 144, 0.1)' }}
                            />
                            <Bar 
                                dataKey="value" 
                                fill="rgb(14 116 144)"
                                radius={[4, 4, 0, 0]} // rounded corners on top
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

export default SampleChart;
