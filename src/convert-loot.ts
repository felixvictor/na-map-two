import type {
    APIItemGeneric,
    APILootTableItem,
    APIShipLootTableItem,
    APITimeBasedConvertibleItem,
    ItemsEntity,
} from "./@types/api-item.js"
import type {
    Loot,
    LootChestItemsEntity,
    LootChestsEntity,
    LootLootEntity,
    LootLootItemsEntity,
} from "./@types/loot.js"
import { cleanName } from "./common/api.js"
import { getApiItems } from "./common/common.js"
import { saveJsonAsync } from "./common/file.js"
import { getOrdinal } from "./common/format.js"
import { getCommonPaths } from "./common/path.js"
import { sortBy } from "./common/sort.js"

const secondsPerHour = 3600

let apiItems: APIItemGeneric[]
let itemNames: Map<number, string>

const getLootName = (classId: number, isMission: boolean): string => {
    if (classId === -1) {
        return "Trader bot (open world)"
    }

    return `${getOrdinal(classId, false)} rate bot (${isMission ? "mission" : "open world"})`
}

const getLootItemName = (name: string, type: string): string => {
    let cleanedName = cleanName(name)

    if (type === "Recipe" && !cleanedName.endsWith("Blueprint")) {
        cleanedName += " Blueprint"
    }

    return cleanedName
}

const getLootItems = (types: string[]) => apiItems.filter((item) => !item.NotUsed && types.includes(item.ItemType))

const getLootItemsChance = (chestLootTableId: number): number => {
    const lootTable = apiItems.filter((item) => Number(item.Id) === chestLootTableId) as APILootTableItem[]
    return lootTable[0]?.Items?.[0]?.Chance
}

const getLootContent = (
    lootItems: ItemsEntity[],
    itemProbability: number[],
    revertChance = false,
): LootLootItemsEntity[] =>
    lootItems.map(
        (item): LootLootItemsEntity => ({
            id: Number(item.Template),
            name: itemNames.get(Number(item.Template)) ?? "",
            chance:
                itemProbability.length > 0
                    ? Number(itemProbability[Number(item.Chance)])
                    : revertChance
                      ? 1 - Number(item.Chance)
                      : Number(item.Chance),
            amount: { min: Number(item.Stack.Min), max: Number(item.Stack.Max) },
        }),
    )

const getChestItems = (lootItems: ItemsEntity[]): LootChestItemsEntity[] =>
    lootItems.map((item) => ({
        id: Number(item.Template),
        name: itemNames.get(Number(item.Template)) ?? "",
        amount: { min: Number(item.Stack.Min), max: Number(item.Stack.Max) },
    }))

const getChestItemsFromChestLootTable = (chestLootTableId: number): LootChestItemsEntity[] =>
    apiItems.filter((item) => Number(item.Id) === chestLootTableId).flatMap((item) => getChestItems(item.Items ?? []))

const convertLoot = async (): Promise<void> => {
    const commonPaths = getCommonPaths()
    const data = {} as Loot

    // Loot
    const loot = getLootItems(["ShipLootTableItem"]) as APIShipLootTableItem[]
    data.loot = loot
        .map(
            (item) =>
                ({
                    id: Number(item.Id),
                    name: getLootName(Number(item.Class), item.EventLootTable),
                    items: getLootContent(item.Items, item.itemProbability).sort(sortBy(["chance", "id"])),
                }) as LootLootEntity,
        )
        .sort(sortBy(["id"]))

    // Chests
    const chests = getLootItems(["TimeBasedConvertibleItem"]) as APITimeBasedConvertibleItem[]
    data.chest = chests
        .map(
            (item) =>
                ({
                    id: Number(item.Id),
                    name: cleanName(item.Name),
                    weight: Number(item.ItemWeight),
                    lifetime: Number(item.LifetimeSeconds) / secondsPerHour,
                    itemGroup: item.ExtendedLootTable.map((lootChestLootTableId) => ({
                        chance: getLootItemsChance(lootChestLootTableId),
                        items: getChestItemsFromChestLootTable(lootChestLootTableId).sort(sortBy(["id"])),
                    })).sort(sortBy(["chance"])),
                }) as LootChestsEntity,
        )
        .sort(sortBy(["id"]))

    // Fish
    const fish = getLootItems(["LootTableItem"]) as APIShipLootTableItem[]
    data.fish = fish
        .filter((item) => item.Name.endsWith("Fishing Loot Table"))
        .map(
            (item) =>
                ({
                    id: Number(item.Id),
                    name: cleanName(item.Name.replace(" Fishing Loot Table", "")),
                    items: getLootContent(item.Items, [], true).sort(sortBy(["chance", "id"])),
                }) as LootLootEntity,
        )
        .sort(sortBy(["id"]))

    await saveJsonAsync(commonPaths.fileLoot, data)
}

export const convertLootData = (): void => {
    apiItems = getApiItems()
    itemNames = new Map(apiItems.map((item) => [Number(item.Id), getLootItemName(item.Name, item.ItemType)]))

    void convertLoot()
}
