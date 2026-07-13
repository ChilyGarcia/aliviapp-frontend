export const getUserInitials = (name: string): string => {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
};

export const getFirstName = (name: string): string => {
    return name.split(" ")[0];
};
