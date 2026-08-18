import { useCallback, useState } from 'react';

import { router } from 'expo-router';

export const useSetNewPasswordScreen = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = useCallback(() => {
        // TODO: POST /auth/reset-password once the API ships — mock success.
        // Confirmation is its own screen now (Figma 686:26292), so the toast the
        // previous revision showed is gone.
        router.push('/(app)/(auth)/password-changed');
    }, []);

    return {
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        handleSubmit,
    };
};
