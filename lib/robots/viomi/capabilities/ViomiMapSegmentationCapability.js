const MapSegmentationCapability = require("../../../core/capabilities/MapSegmentationCapability");

const attributes = require("../ViomiCommonAttributes");
const stateAttrs = require("../../../entities/state/attributes");

class ViomiMapSegmentationCapability extends MapSegmentationCapability {

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
     * Automatically set movement mode based on the previously computed operation mode
     *
     * @param {attributes.ViomiOperationMode} operationMode
     * @param {boolean} [outline] Vacuum along the edges
     * @returns {attributes.ViomiMovementMode}
     */
    getAutoVacuumMovementMode(operationMode, outline) {
        if (outline) {
            return attributes.ViomiMovementMode.OUTLINE;
        }

        switch (operationMode) {
            case attributes.ViomiOperationMode.MIXED:
                return attributes.ViomiMovementMode.MOP_MOVES;
            case attributes.ViomiOperationMode.MOP:
                // doesn't support mop_moves with water-only tank
                return attributes.ViomiMovementMode.ZONED_CLEAN_OR_MOPPING;
            case attributes.ViomiOperationMode.VACUUM:
                return attributes.ViomiMovementMode.NORMAL_CLEANING;
        }
    }

    async executeSegmentAction(segments) {
        await this.stop();

        const operationMode = this.getAutoVacuumOperationMode();
        const curOperationMode = this.robot.state.getFirstMatchingAttributeByConstructor(
            stateAttrs.OperationModeStateAttribute
        );

        if (!curOperationMode || curOperationMode && curOperationMode.VALUE !== operationMode) {
            await this.robot.sendCommand("set_mop", [operationMode]);
        }

        const outline = false;
        const movementMode = this.getAutoVacuumMovementMode(operationMode, outline);

        if (movementMode === attributes.ViomiMovementMode.MOP_MOVES) {
            await this.robot.sendCommand("set_moproute", [1]);
        } else {
            await this.robot.sendCommand("set_moproute", [0]);
        }

        const segmentIds = segments.map(segment => segment.id);
        let payload = [movementMode, attributes.ViomiOperation.START, segmentIds.length];

        await this.robot.sendCommand("set_mode_withroom", payload.concat(segmentIds));
    }

    async stop() {
        await this.robot.sendCommand("set_mode", [attributes.ViomiOperation.STOP]);
    }

    /**
     * @param {import("../../../entities/core/ValetudoMapSegment")} segmentA
     * @param {import("../../../entities/core/ValetudoMapSegment")} segmentB
     * @returns {Promise<void>}
     */
    async joinSegments(segmentA, segmentB) {
        const result = await this.robot.sendCommand("get_map", []);

        // noinspection JSUnresolvedVariable
        if (result.length < 1) {
            throw new Error("Invalid mapId returned by vacuum");
        }

        await this.robot.sendCommand("arrange_room", {
            lang: "de",
            mapID: result[0].id,
            roomArr: [[segmentA.id, segmentB.id]],
            type: 0,
        }, {timeout: 5000}).finally(() => {
            this.robot.pollMap();
        });
    }
}


module.exports = ViomiMapSegmentationCapability;
