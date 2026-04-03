export const deleteEmployee = async (emp_id) => {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/employees/${emp_id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const message = `Error deleting employee: ${response.status}`;
            throw new Error(message);
        }

        return await response.json();
    } catch (error) {
        console.error("Delete employee error:", error);
        throw error;
    }
};
