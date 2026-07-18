import { useCallback, useState } from 'react';

import { router } from 'expo-router';

export const useForgotPasswordScreen = () => {
    const [email, setEmail] = useState('');

    const handleSubmit = useCallback(() => {
        // TODO: POST /auth/forgot-password once the API ships — mock flow goes
        // straight to the code verification step.
        router.push({
            pathname: '/(app)/(auth)/email-verify',
            params: { email, flow: 'password-reset' },
        });
    }, [email]);

    return { email, setEmail, handleSubmit };
};
