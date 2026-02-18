import React from 'react';
import { Heading, Text } from '../atoms/Typography';
import { LiveEarningsWidget } from '../organisms/LiveEarningsWidget';
import { SmartModifiers } from '../organisms/SmartModifiers';
import { DyeCalculator } from '../organisms/DyeCalculator';

export const MasterView = () => {
    const [selectedAppointment, setSelectedAppointment] = React.useState(null);

    return (
        <div className="space-y-6 pb-safe">
            <div className="mb-2">
                <Heading level={1}>Master Session</Heading>
                <Text>Manage current client workflow</Text>
            </div>

            {/* List of Appointments */}
            {!selectedAppointment && (
                <LoadAppointmentList onSelect={setSelectedAppointment} />
            )}

            {/* Selected Appointment Workflow */}
            {selectedAppointment && (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <div className="flex items-center justify-between">
                        <Heading level={2}>
                            Client: {selectedAppointment.client_name}
                        </Heading>
                        <button
                            onClick={() => setSelectedAppointment(null)}
                            className="text-primary font-bold text-sm"
                        >
                            Change
                        </button>
                    </div>

                    <LiveEarningsWidget
                        currentEarnings={145.20} // This should eventually be real too
                        materialCost={0} // TODO: Calculate from usage_logs
                        allowance={selectedAppointment.service_price * 0.1 || 25.00} // Mock logic
                    />

                    <SmartModifiers />

                    <DyeCalculator appointment={selectedAppointment} />
                </div>
            )}

            {/* Additional spacing for bottom nav */}
            <div className="h-4" />
        </div>
    );
};

// Lazy load to avoid circular deps if any (good practice)
const LoadAppointmentList = React.lazy(() => import('../organisms/AppointmentList'));
