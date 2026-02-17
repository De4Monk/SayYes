import React, { useState } from 'react';
import { Card } from '../atoms/Card';
import { Heading } from '../atoms/Typography';
import { SegmentedControl } from '../molecules/SegmentedControl';

export const SmartModifiers = () => {
    const [length, setLength] = useState('medium');
    const [density, setDensity] = useState('normal');
    const [gray, setGray] = useState('none');

    return (
        <Card className="flex flex-col gap-6">
            <Heading level={2}>Smart Modifiers</Heading>

            <SegmentedControl
                label="Hair Length"
                value={length}
                onChange={setLength}
                options={[
                    { label: 'Short', value: 'short' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'Long', value: 'long' },
                    { label: 'Extra', value: 'extra' },
                ]}
            />

            <SegmentedControl
                label="Hair Density"
                value={density}
                onChange={setDensity}
                options={[
                    { label: 'Thin', value: 'thin' },
                    { label: 'Normal', value: 'normal' },
                    { label: 'Thick', value: 'thick' },
                ]}
            />

            <SegmentedControl
                label="Gray Coverage"
                value={gray}
                onChange={setGray}
                options={[
                    { label: 'None', value: 'none' },
                    { label: '<50%', value: 'low' },
                    { label: '>50%', value: 'high' },
                ]}
            />
        </Card>
    );
};
