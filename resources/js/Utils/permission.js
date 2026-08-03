export const can = (permissions, menuKey, action = null) => {
    if (!permissions) return false;

    const cleanKey = menuKey.replace(/^\/+/, "").split("/")[0];

    return permissions.some((p) => {
        if (p.menu?.key !== cleanKey) return false;

        if (!action) return true;

        return p.action.includes(action) ? true : false;
    });
};

export const msg = (key) => {
    if (key === "forbidden")
        return "You don't have permission to perform this action."
};
