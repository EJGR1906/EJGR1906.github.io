import { db, type Account, type CurrencyCode } from "../database/db";
import { createAccount, getAccountById, updateAccount } from "../repositories/accountRepository";
import { generateId } from "../utils/id";

export interface AccountInput {
    name: string;
    type: Account["type"];
    currency: CurrencyCode;
    initialBalance: number;
    linkedUsdAccount?: boolean;
    secondaryUsdBalance?: number;
}

function validateAccount(input: AccountInput): void {
    if (!input.name.trim()) throw new Error("El nombre de la cuenta es obligatorio.");
    if (!Number.isFinite(input.initialBalance) || input.initialBalance < 0) {
        throw new Error("El saldo inicial debe ser un número mayor o igual a cero.");
    }

    if (input.linkedUsdAccount && input.currency !== "VES") {
        throw new Error("La subcuenta USD solo se crea para cuentas VES.");
    }

    if (input.linkedUsdAccount) {
        if (!Number.isFinite(input.secondaryUsdBalance ?? 0) || (input.secondaryUsdBalance ?? 0) < 0) {
            throw new Error("El saldo inicial en USD debe ser un número mayor o igual a cero.");
        }
    }
}

export async function addAccount(input: AccountInput): Promise<Account> {
    validateAccount(input);

    const accountGroupId = input.linkedUsdAccount ? crypto.randomUUID() : undefined;

    const baseAccount: Account = {
        id: generateId("account"),
        name: input.name.trim(),
        type: input.type,
        currency: input.currency,
        initialBalance: input.initialBalance,
        active: true,
        institutionId: accountGroupId,
    };

    if (!input.linkedUsdAccount) {
        await createAccount(baseAccount);
        return baseAccount;
    }

    const usdAccount: Account = {
        id: generateId("account"),
        name: `${input.name.trim()} - USD`,
        type: input.type,
        currency: "USD",
        initialBalance: input.secondaryUsdBalance ?? 0,
        active: true,
        institutionId: accountGroupId,
    };

    await db.transaction("rw", db.accounts, async () => {
        await createAccount(baseAccount);
        await createAccount(usdAccount);
    });

    return baseAccount;
}

export async function editAccount(id: string, input: Pick<AccountInput, "name" | "type">): Promise<void> {
    if (!input.name.trim()) throw new Error("El nombre de la cuenta es obligatorio.");
    await updateAccount(id, { name: input.name.trim(), type: input.type });
}

export async function setAccountActive(id: string, active: boolean): Promise<void> {
    await updateAccount(id, { active });
}

export async function setLinkedUsdAccount(
    vesAccountId: string,
    enabled: boolean,
    initialBalance = 0
): Promise<Account | undefined> {
    const vesAccount = await getAccountById(vesAccountId);
    if (!vesAccount || vesAccount.currency !== "VES") {
        throw new Error("Solo una cuenta VES puede tener una cuenta USD vinculada.");
    }

    const accounts = await db.accounts.toArray();
    const groupId = vesAccount.institutionId ?? crypto.randomUUID();
    const linkedUsd = accounts.find(
        (account) => account.institutionId === groupId && account.currency === "USD"
    );

    if (!enabled) {
        if (linkedUsd) await updateAccount(linkedUsd.id, { active: false });
        return linkedUsd;
    }

    if (linkedUsd) {
        await db.transaction("rw", db.accounts, async () => {
            await updateAccount(vesAccount.id, { institutionId: groupId });
            await updateAccount(linkedUsd.id, { active: true });
        });
        return { ...linkedUsd, active: true, institutionId: groupId };
    }

    const usdAccount: Account = {
        id: generateId("account"),
        name: `${vesAccount.name} - USD`,
        type: vesAccount.type,
        currency: "USD",
        initialBalance,
        active: true,
        institutionId: groupId,
    };

    await db.transaction("rw", db.accounts, async () => {
        await updateAccount(vesAccount.id, { institutionId: groupId });
        await createAccount(usdAccount);
    });

    return usdAccount;
}
