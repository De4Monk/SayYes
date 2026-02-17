import React, { useState } from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { UserCheck } from 'lucide-react';

const StaffTrustRow = ({ name, role, initialTrust }) => {
    const [trust, setTrust] = useState(initialTrust);

    return (
        <div className="flex items-center gap-4 py-3 border-b border-zinc-100 last:border-0">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                {name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-grow">
                <div className="font-bold text-sm">{name}</div>
                <Text variant="caption">{role} • Trust: {trust}%</Text>
            </div>
            <input
                type="range"
                min="0"
                max="100"
                value={trust}
                onChange={(e) => setTrust(e.target.value)}
                className="w-24 accent-primary touch-target"
            />
        </div>
    );
};

export const TrustCoefManager = () => {
    // Mock Data
    const staff = [
        { id: 1, name: 'Sarah Adams', role: 'Senior Stylist', trust: 95 },
        { id: 2, name: 'Mark Thompson', role: 'Junior Artist', trust: 60 },
        { id: 3, name: 'Jessica Lee', role: 'Colorist', trust: 85 },
    ];

    return (
        <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <UserCheck size={20} />
                </div>
                <div>
                    <Heading level={3}>Trust Management</Heading>
                    <Text>Adjust permissions & auto-approvals</Text>
                </div>
            </div>

            <div className="flex flex-col">
                {staff.map(s => (
                    <StaffTrustRow key={s.id} {...s} />
                ))}
            </div>
        </Card>
    );
};
