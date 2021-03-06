/**
 * @file svg节点转字形轮廓
 * @author mengke01(kekee000@gmail.com)
 */

define(function (require) {
    var path2contours = require('./path2contours');
    var oval2contour = require('./oval2contour');
    var polygon2contour = require('./polygon2contour');
    var rect2contour = require('./rect2contour');
    var parseTransform = require('./parseTransform');
    var contoursTransform = require('./contoursTransform');

    // 支持的解析器集合
    var support = {

        path: {
            parse: path2contours, // 解析器
            params: ['d'], // 参数列表
            contours: true // 是否是多个轮廓
        },

        circle: {
            parse: oval2contour,
            params: ['cx', 'cy', 'r']
        },

        ellipse: {
            parse: oval2contour,
            params: ['cx', 'cy', 'rx', 'ry']
        },

        rect: {
            parse: rect2contour,
            params: ['x', 'y', 'width', 'height']
        },

        polygon: {
            parse: polygon2contour,
            params: ['points']
        },

        polyline: {
            parse: polygon2contour,
            params: ['points']
        }
    };

    /**
     * svg节点转字形轮廓
     *
     * @param {Array} xmlNodes xml节点集合
     * @return {Array|false} 轮廓数组
     */
    function svgnode2contours(xmlNodes) {
        var i;
        var length;
        var j;
        var jlength;
        var segment; // 当前指令
        var parsedSegments = []; // 解析后的指令

        if (xmlNodes.length) {
            for (i = 0, length = xmlNodes.length; i < length; i++) {
                var node = xmlNodes[i];
                var name = node.tagName;
                if (support[name]) {
                    var supportParams = support[name].params;
                    var params = [];
                    for (j = 0, jlength = supportParams.length; j < jlength; j++) {
                        params.push(node.getAttribute(supportParams[j]));
                    }

                    segment = {
                        name: name,
                        params: params,
                        transform: parseTransform(node.getAttribute('transform'))
                    };

                    if (node.parentNode) {
                        var curNode = node.parentNode;
                        var transforms = segment.transform || [];
                        var transAttr;
                        var iterator = function (t) {
                            transforms.unshift(t);
                        };
                        while (curNode !== null && curNode.tagName !== 'svg') {
                            transAttr = curNode.getAttribute('transform');
                            if (transAttr) {
                                parseTransform(transAttr).reverse().forEach(iterator);
                            }
                            curNode = curNode.parentNode;
                        }

                        segment.transform = transforms.length ? transforms : null;
                    }
                    parsedSegments.push(segment);
                }
            }
        }

        if (parsedSegments.length) {
            var result = [];
            for (i = 0, length = parsedSegments.length; i < length; i++) {
                segment = parsedSegments[i];
                var parser = support[segment.name];
                var contour = parser.parse.apply(null, segment.params);
                if (contour && contour.length) {
                    var contours = parser.contours ? contour : [contour];

                    // 如果有变换则应用变换规则
                    if (segment.transform) {
                        contours = contoursTransform(contours, segment.transform);
                    }

                    for (j = 0, jlength = contours.length; j < jlength; j++) {
                        result.push(contours[j]);
                    }
                }
            }
            return result;
        }

        return false;
    }

    return svgnode2contours;
});
