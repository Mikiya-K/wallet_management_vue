export function handleApiError(error) {
    if (error.response) {
        const response = error.response;
        const backendError = response.data?.error?.message

        return backendError;
    }

    if (error.request) return 'Network error';
    return error.message || 'Unknown error';
}
