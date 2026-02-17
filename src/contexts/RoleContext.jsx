import React, { createContext, useContext, useState } from 'react';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
    const [currentRole, setCurrentRole] = useState('master');

    const switchRole = (role) => {
        setCurrentRole(role);
    };

    return (
        <RoleContext.Provider value={{ currentRole, switchRole }}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () => {
    const context = useContext(RoleContext);
    if (!context) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
};
