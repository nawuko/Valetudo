const ZoneCleaningCapability = require("../../../core/capabilities/ZoneCleaningCapability");
const ViomiMapParser = require("../../../ViomiMapParser");
const Logger = require("../../../Logger");

const attributes = require("../ViomiCommonAttributes");
const stateAttrs = require("../../../entities/state/attributes");

class ViomiZoneCleaningCapability extends ZoneCleaningCapability {
    /**
     * Automatically sets mop mode depending on what tools are currently installed
     *
     * @returns {attributes.ViomiOperationMode}
     */
    getAutoVacuumOperationMode() {
        const dustbinAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: stateAttrs.AttachmentStateAttribute.name,
            attributeType: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN
        });
        const waterboxAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: stateAttrs.AttachmentStateAttribute.name,
            attributeType: stateAttrs.AttachmentStateAttribute.TYPE.WATERBOX
        });
        const mopAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: stateAttrs.AttachmentStateAttribute.name,
            attributeType: stateAttrs.AttachmentStateAttribute.TYPE.MOP
        });

        if (mopAttribute) {
            if (waterboxAttribute && dustbinAttribute) {
                return attributes.ViomiOperationMode.MIXED;
            }
            return attributes.ViomiOperationMode.MOP;
        }
        return attributes.ViomiOperationMode.VACUUM;
    }

    /**
     * @param {Array<import("../../../entities/core/ValetudoZone")>} valetudoZones
     * @returns {Promise<void>}
     */
    async start(valetudoZones) {
        await this.stop();

        const operationMode = this.getAutoVacuumOperationMode();
        const curOperationMode = this.robot.state.getFirstMatchingAttributeByConstructor(
            stateAttrs.OperationModeStateAttribute
        );

        if (!curOperationMode || curOperationMode && curOperationMode.VALUE !== operationMode) {
            await this.robot.sendCommand("set_mop", [operationMode]);
        }

        let areas = [];

        valetudoZones.forEach( zone => {
            const pA = ViomiMapParser.positionToViomi(zone.points.pA.x, zone.points.pA.y);
            const pC = ViomiMapParser.positionToViomi(zone.points.pC.x, zone.points.pC.y);

            for (let j = 0; j < zone.iterations; j++) {
                areas.push([areas.length,
                    attributes.ViomiArea.NORMAL,
                    pA.x.toFixed(4),
                    pA.y.toFixed(4),
                    pA.x.toFixed(4),
                    pC.y.toFixed(4),
                    pC.x.toFixed(4),
                    pC.y.toFixed(4),
                    pC.x.toFixed(4),
                    pA.y.toFixed(4),
                ].join("_"));
            }
        });

        Logger.trace("areas to clean: ", areas);

        await this.robot.sendCommand("set_zone", [areas.length].concat(areas), {});
        await this.robot.sendCommand("set_mode", [attributes.ViomiMovementMode.ZONED_CLEAN_OR_MOPPING, attributes.ViomiOperation.START]);
    }

    async stop() {
        await this.robot.sendCommand("set_mode", [attributes.ViomiOperation.STOP]);
    }

    /**
     * @returns {import("../../../core/capabilities/ZoneCleaningCapability").ZoneCleaningCapabilityProperties}
     */
    getProperties() {
        return {
            zoneCount: {
                min: 1,
                max: 5
            },
            iterationCount: {
                min: 1,
                max: 10 //completely arbitrary. Is this correct?
            }
        };
    }
}

module.exports = ViomiZoneCleaningCapability;
