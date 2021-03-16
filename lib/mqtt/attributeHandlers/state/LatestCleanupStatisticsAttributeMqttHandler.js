const StateAttributeMqttHandler = require("./StateAttributeMqttHandler");
const {LatestCleanupStatisticsAttribute} = require("../../../entities/state/attributes");

class LatestCleanupStatisticsAttributeMqttHandler extends StateAttributeMqttHandler {

    /**
     * @public
     *
     * @param {object} options
     * @param {string} options.topicPrefix
     * @param {string} options.autoconfPrefix
     * @param {string} options.identifier
     * @param {object} options.deviceSpecification
     * @param {string} options.availabilityTopic There's only one because there can only be one LWT
     */
    getAutoConfData(options) {
        return {
            topic: options.autoconfPrefix + "/sensor/" + options.identifier + "/" +
                   this.attribute.__class + "_" + this.getIdentifier() + "/config",
            payload: { //TODO: expire_after? //TODO:  force_update ? //TODO: icon?
                availability_topic: options.availabilityTopic,
                device: options.deviceSpecification,
                name: this.name,
                state_topic: this.getStateTopic({
                    topicPrefix: options.topicPrefix,
                    identifier: options.identifier
                }),
                unique_id: options.identifier + "_" + this.attribute.__class + "_" + this.getIdentifier(),
                unit_of_measurement: this.unit,
                icon: this.icon
            }
        };
    }

    /**
     * @public
     *
     * @param {object} options
     * @param {string} options.topicPrefix
     * @param {string} options.identifier
     */
    getStateTopic(options) {
        return options.topicPrefix + "/" + options.identifier + "/" + this.attribute.__class + "_" + this.getIdentifier() + "/state";
    }

    /**
     * @public
     *
     * @returns {Array | boolean | object | number | string}
     */
    getPayload() {
        return this.attribute.value;
    }

    /**
     * @private
     *
     * @returns {string}
     */
    get unit() {
        switch (this.attribute.type) {
            case LatestCleanupStatisticsAttribute.TYPE.DURATION:
                return "Seconds";
            default:
                return "";
        }
    }

    /**
     * @private
     *
     * @returns {string}
     */
    get name() {
        let name = "";

        switch (this.attribute.type) {
            case LatestCleanupStatisticsAttribute.TYPE.AREA:
                name = "Area";
                break;
            case LatestCleanupStatisticsAttribute.TYPE.DURATION:
                name = "Duration";
                break;
            default:
                name = this.attribute.type;
        }

        return name;
    }

    /**
     * @private
     *
     * @returns {string}
     */
    get icon() {
        switch (this.attribute.type) {
            case LatestCleanupStatisticsAttribute.TYPE.DURATION:
                return "mdi:progress-clock";
            default:
                return "mdi:progress-wrench";
        }
    }

    /**
     * @private
     */
    getIdentifier() {
        let identifier = this.attribute.type;
        return identifier;
    }
}

module.exports = LatestCleanupStatisticsAttributeMqttHandler;