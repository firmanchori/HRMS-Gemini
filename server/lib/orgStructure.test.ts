import { describe, it, expect } from "vitest";
import { computeNewEntityClosureRows, buildEntityTree, applyChangeSet, type EntityNode } from "./orgStructure.ts";

describe("computeNewEntityClosureRows — vertical-only visibility", () => {
  it("a root entity (no parent) only gets a self row at depth 0", () => {
    expect(computeNewEntityClosureRows("holding", [])).toEqual([{ ancestorEntityId: "holding", descendantEntityId: "holding", depth: 0 }]);
  });

  it("a child copies its parent's ancestor chain, each one depth+1, plus its own self row", () => {
    // Holding's own closure (holding is its own ancestor at depth 0)
    const holdingAncestors = [{ ancestorEntityId: "holding", descendantEntityId: "holding", depth: 0 }];
    const rows = computeNewEntityClosureRows("anakA", holdingAncestors);
    expect(rows).toContainEqual({ ancestorEntityId: "anakA", descendantEntityId: "anakA", depth: 0 });
    expect(rows).toContainEqual({ ancestorEntityId: "holding", descendantEntityId: "anakA", depth: 1 });
    expect(rows).toHaveLength(2);
  });

  it("a grandchild inherits the full ancestor chain (grandparent + parent), never a sibling", () => {
    // anakA's own ancestor chain: itself (0) + holding (1)
    const anakAAncestors = [
      { ancestorEntityId: "anakA", descendantEntityId: "anakA", depth: 0 },
      { ancestorEntityId: "holding", descendantEntityId: "anakA", depth: 1 },
    ];
    const rows = computeNewEntityClosureRows("cucuC", anakAAncestors);
    expect(rows).toContainEqual({ ancestorEntityId: "cucuC", descendantEntityId: "cucuC", depth: 0 });
    expect(rows).toContainEqual({ ancestorEntityId: "anakA", descendantEntityId: "cucuC", depth: 1 });
    expect(rows).toContainEqual({ ancestorEntityId: "holding", descendantEntityId: "cucuC", depth: 2 });
    expect(rows).toHaveLength(3);
    // No row ever names a sibling ("anakB") as an ancestor of cucuC.
    expect(rows.some((r) => r.ancestorEntityId === "anakB")).toBe(false);
  });
});

describe("buildEntityTree", () => {
  interface TestEntity extends EntityNode {
    name: string;
  }

  it("nests children under their parent and leaves roots at the top", () => {
    const flat: TestEntity[] = [
      { id: "holding", parentEntityId: null, name: "Holding" },
      { id: "anakA", parentEntityId: "holding", name: "Anak A" },
      { id: "anakB", parentEntityId: "holding", name: "Anak B" },
      { id: "cucuC", parentEntityId: "anakA", name: "Cucu C" },
    ];
    const tree = buildEntityTree(flat);
    expect(tree).toHaveLength(1);
    expect(tree[0].entity.name).toBe("Holding");
    expect(tree[0].children).toHaveLength(2);
    const anakA = tree[0].children.find((c) => c.entity.name === "Anak A")!;
    expect(anakA.children).toHaveLength(1);
    expect(anakA.children[0].entity.name).toBe("Cucu C");
  });
});

describe("applyChangeSet — proposal apply logic", () => {
  interface Row {
    id: string;
    name: string;
  }
  const current: Row[] = [
    { id: "d1", name: "Finance" },
    { id: "d2", name: "Engineering" },
  ];

  it("creates new rows", () => {
    const result = applyChangeSet(current, { create: [{ id: "d3", name: "Marketing" }] });
    expect(result).toHaveLength(3);
    expect(result.find((r) => r.id === "d3")).toEqual({ id: "d3", name: "Marketing" });
  });

  it("updates existing rows by merging fields", () => {
    const result = applyChangeSet(current, { update: [{ id: "d1", data: { name: "Finance & Tax" } }] });
    expect(result.find((r) => r.id === "d1")).toEqual({ id: "d1", name: "Finance & Tax" });
    expect(result.find((r) => r.id === "d2")).toEqual({ id: "d2", name: "Engineering" });
  });

  it("deletes rows by id", () => {
    const result = applyChangeSet(current, { delete: ["d2"] });
    expect(result).toEqual([{ id: "d1", name: "Finance" }]);
  });

  it("applies create, update, and delete together in one changeset", () => {
    const result = applyChangeSet(current, {
      create: [{ id: "d3", name: "Marketing" }],
      update: [{ id: "d1", data: { name: "Finance & Tax" } }],
      delete: ["d2"],
    });
    expect(result).toEqual([
      { id: "d1", name: "Finance & Tax" },
      { id: "d3", name: "Marketing" },
    ]);
  });

  it("is a no-op when no changeset is given", () => {
    expect(applyChangeSet(current, undefined)).toEqual(current);
  });
});
