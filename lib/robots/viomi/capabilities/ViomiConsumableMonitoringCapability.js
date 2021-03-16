const ConsumableMonitoringCapability = require("../../../core/capabilities/ConsumableMonitoringCapability");

const entities = require("../../../entities");

const stateAttrs = entities.state.attributes;

const CONSUMABLE_PROPERTIES = [
    "main_brush_hours",
    "side_brush_hours",
    "hypa_hours",
    "mop_hours"
];

class ViomiConsumableMonitoringCapability extends ConsumableMonitoringCapability {
    /**
     * This function polls the current consumables state and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Promise<Array<import("../../../entities/state/attributes/ConsumableStateAttribute")>>}
     */
    async getConsumables() {
        const response = await this.robot.sendCommand("get_prop", CONSUMABLE_PROPERTIES);

        if (response) {
            let data = {};

            CONSUMABLE_PROPERTIES.forEach((key, index) => data[key] = response[index]);

            if (data["main_brush_hours"] !== undefined) {
                this.robot.state.upsertFirstMatchingAttribute(new stateAttrs.ConsumableStateAttribute({
                    type: stateAttrs.ConsumableStateAttribute.TYPE.BRUSH,
                    subType: stateAttrs.ConsumableStateAttribute.SUB_TYPE.MAIN,
                    remaining: {
                        value: Math.round(Math.max(0, data["main_brush_hours"] * 60)),
                        unit: stateAttrs.ConsumableStateAttribute.UNITS.MINUTES
                    }
                }));
            }

            if (data["side_brush_hours"] !== undefined) {
                this.robot.state.upsertFirstMatchingAttribute(new stateAttrs.ConsumableStateAttribute({
                    type: stateAttrs.ConsumableStateAttribute.TYPE.BRUSH,
                    subType: stateAttrs.ConsumableStateAttribute.SUB_TYPE.SIDE_RIGHT,
                    remaining: {
                        value: Math.round(Math.max(0, data["side_brush_hours"] * 60)),
                        unit: stateAttrs.ConsumableStateAttribute.UNITS.MINUTES
                    }
                }));
            }

            if (data["hypa_hours"] !== undefined) {
                this.robot.state.upsertFirstMatchingAttribute(new stateAttrs.ConsumableStateAttribute({
                    type: stateAttrs.ConsumableStateAttribute.TYPE.FILTER,
                    subType: stateAttrs.ConsumableStateAttribute.SUB_TYPE.MAIN,
                    remaining: {
                        value: Math.round(Math.max(0, data["hypa_hours"] * 60)),
                        unit: stateAttrs.ConsumableStateAttribute.UNITS.MINUTES
                    }
                }));
            }

            if (data["mop_hours"] !== undefined) {
                this.robot.state.upsertFirstMatchingAttribute(new stateAttrs.ConsumableStateAttribute({
                    type: stateAttrs.ConsumableStateAttribute.TYPE.MOP,
                    subType: stateAttrs.ConsumableStateAttribute.SUB_TYPE.MAIN,
                    remaining: {
                        value: Math.round(Math.max(0, data["mop_hours"] * 60)),
                        unit: stateAttrs.ConsumableStateAttribute.UNITS.MINUTES
                    }
                }));
            }

            this.robot.emitStateUpdated();

            return this.robot.state.getMatchingAttributes({attributeClass: stateAttrs.ConsumableStateAttribute.name});
        } else {
            return [];
        }
    }

    /**
     * @abstract
     * @param {string} type
     * @param {string} [subType]
     * @returns {Promise<void>}
     */
    async resetConsumable(type, subType) {
        throw new Error("Not implemented");
    }
}

module.exports = ViomiConsumableMonitoringCapability;
