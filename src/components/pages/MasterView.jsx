import React from 'react';
import { Heading, Text } from '../atoms/Typography';
import { LiveEarningsWidget } from '../organisms/LiveEarningsWidget';
import { SmartModifiers } from '../organisms/SmartModifiers';
import { DyeCalculator } from '../organisms/DyeCalculator';

export const MasterView = () => {
    return (
        <div className="space-y-6 pb-safe">
            <div className="mb-2">
                <Heading level={1}>Master Session</Heading>
                <Text>Manage current client workflow</Text>
            </div>

            <LiveEarningsWidget currentEarnings={145.20} materialCost={12.50} allowance={25.00} />

            <SmartModifiers />

            <DyeCalculator />

            {/* Additional spacing for bottom nav */}
            <div className="h-4" />
        </div>
    );
};
