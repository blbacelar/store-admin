
import React from 'react';

export const BrazilFlag: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <img src="/brazil.svg" alt="Brazil Flag" className={className} />
);

export const USAFlag: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <img src="/usa.svg" alt="USA Flag" className={className} />
);
