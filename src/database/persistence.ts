let activeUserId: string | null = null;

export function setActiveUser(userId: string | null): void {
    activeUserId = userId;
}

export function getActiveUserId(): string | null {
    return activeUserId;
}

export function isCloudPersistenceEnabled(): boolean {
    return activeUserId !== null;
}
