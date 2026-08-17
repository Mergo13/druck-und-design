import assert from "node:assert/strict";
import { defaultProductionBindingConfig } from "@/lib/production-binding-config";

const config = defaultProductionBindingConfig();

assert.ok(config.bindingSystems.length >= 2);
assert.ok(config.bindingSystems.some((system) => system.id === "wire-3-1"));
assert.ok(config.bindingSystems.some((system) => system.id === "opus-c-bind"));
assert.ok(config.bindingVariants.some((variant) => variant.bindingSystemId === "opus-c-bind" && variant.active));
assert.ok(config.updatedAt);

console.log("production-binding-config tests passed");
