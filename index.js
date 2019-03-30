const RUH_ATTR_KEY = '@ruhg-attr';
const RUH_PROCESSOR_KEY = '@ruh-processor';
const RUH_RENDERER_KEY = '@ruh-renderer';

function Ruh(configuration = {}) {
    this.configuration = configuration;
    this.config = userConfiguration => new Ruh(userConfiguration);
    this.generateObject = input => generateObject(input, this);
    this.generateObjectString = input => ruhRender(generateObject(input, this));
}

module.exports = new Ruh();

function ruhRender(element, depth=0) {
    if (Array.isArray(element)) {
        return arrayToString(element, depth)
    }
    if (element === null) {
        return 'null';
    }
    if (typeof (element) === 'object') {
        return objectToString(element, depth);
    }
    return JSON.stringify(element);
}

function newline(depth) {
    const tabSize = 4;
    return '\n' + (new Array((depth + 1) * tabSize)).join(' ');
}

function isRuhAttribute(object) {
    if (typeof (object) === 'object' && object !== null) {
        const t = typeof (object[RUH_ATTR_KEY]);
        if (t !== 'undefined' && t !== false) {
            return true;
        }
    }
    return false;
}

function objectToString(object, depth) {
    return '{' + newline(depth) +
        Object.keys(object).map(k => {
            let value;
            if (isRuhAttribute(object[k])) {
                value = object[k].render(object[k].value);
            }
            else{
                value = ruhRender(object[k], depth+1);
            }
            return '"'+k+'": '+value;
        }).join(',' + newline(depth)) +
        newline(depth - 1) +
        '}';
}

function arrayToString(array, depth) {
    return '[' + newline(depth) +
        array.map(el => ruhRender(el, depth + 1)).join(',' + newline(depth)) +
        newline(depth - 1) +
        ']';
}

function generateObject(input, ruh) {
    return Object.keys(input)
        .reduce((o, key) => {
            return {
                ...o,
                [key]: process(input[key], ruh)
            };
        }, {});
}

function process(value, ruh) {
    if (isRuhAttribute(value)) {
        return processRuhAttribute(value, ruh);
    }
    return value;
}

function processRuhAttribute(value, ruh) {
    const {configuration} = ruh;
    const attributeProcessor = getProcessor(value, configuration);
    return {
        ...value,
        value: attributeProcessor(value.value, ruh),
        render: getRenderer(value, configuration)
    };
}

const defaultProcessor = value => value;
const defaultRenderer = (element, depth) => {
    return ruhRender(element, depth);
};

const pipelineItems = {
    processor: {
        key: RUH_PROCESSOR_KEY,
        default: defaultProcessor
    },
    renderer: {
        key: RUH_RENDERER_KEY,
        default: defaultRenderer
    }
};

const getProcessor = (value, configuration) => getPipelineItem(value, configuration, 'processor');
const getRenderer = (value, configuration) => getPipelineItem(value, configuration, 'renderer');

function getPipelineItem(value, configuration, item) {
    const pipelineKey = pipelineItems[item].key;
    const defaultItem = pipelineItems[item].default;
    const attrType = value[RUH_ATTR_KEY];
    // If the user defines one for this specific attribute,
    // we override any other.
    if (value[pipelineKey]) {
        if (typeof (value[pipelineKey]) !== 'function') {
            throw new Error(`User overridden ${item} is not a function`);
        }
        return value[pipelineKey];
    }

    const t = typeof (attrType);
    if (t === 'boolean') {
        return defaultItem;
    }
    if (t !== 'string') {
        throw new Error('Unsupported processor');
    }

    const fullConfiguration = getConfiguration(configuration);
    if (!fullConfiguration[attrType]) {
        throw new Error(`Couldn't find configuration for ${attrType}`);
    }
    // If the processor is not on the configuration, we default.
    if (!fullConfiguration[attrType][item]) {
        return defaultItem;
    }
    if (typeof (fullConfiguration[attrType][item]) !== 'function') {
        throw new Error(`User configured ${item} is not a function`);
    }
    return fullConfiguration[attrType][item];

}

function getConfiguration(userConfiguration) {
    return {
        ...userConfiguration
    };
}

