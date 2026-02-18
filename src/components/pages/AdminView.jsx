import React from 'react';
import { Heading, Text } from '../atoms/Typography';
import { BarPOSGrid } from '../organisms/BarPOSGrid';
import { VerificationQueue } from '../organisms/VerificationQueue';
import { InventoryTable } from '../organisms/InventoryTable';

export const AdminView = () => {
    return (
        <div className="space-y-8 pb-safe">
            <div className="mb-2">
                <Heading level={1}>Admin Operations</Heading>
                <Text>Manage floor operations and approvals</Text>
            </div>

            <VerificationQueue />

            <InventoryTable />

            <div className="h-1 bg-zinc-100 rounded-full" />

            <BarPOSGrid />

            {/* Additional spacing for bottom nav */}
            <div className="h-4" />
        </div>
    );
};
