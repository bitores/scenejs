SceneJS.Types.addType("frustum/lod", {

    construct:function (params) {

        var self = this;

        var sizes = params.sizes;
        if (!sizes) {
            this.log("error", "mandatory attribute missing: 'sizes'");
            return;
        }

        var nodes = params.nodes;
        if (!nodes) {
            this.log("error", "mandatory attribute missing: 'nodes'");
            return;
        }

        if (sizes.length != nodes.length) {
            this.log("error", "invalid attribute(s): 'sizes' and 'nodes' should be arrays of equal length");
            return;
        }

        for (var i = 0, len = sizes.length; i < len; i++) {
            if (sizes[i] <= 0) {
                this.log("error", "invalid attribute: values in 'sizes' should be greater than zero");
                return;
            }
            if (i > 0) {
                if (sizes[i] <= sizes[i - 1]) {
                    this.log("error", "invalid attribute: values in 'sizes' should be in ascending order");
                    return;
                }
            }
        }

        this.addNode({
                type:"frustum/body",
                shape:params.shape,
                min:params.min,
                max:params.max,
                showBoundary:params.showBoundary,
                cull:true, // Enable visibility culling information (default)
                lod:true // Enable detail culling information (default)
            },
            function (body) {
                if (params.nodes) {
                    var childNodes = [];
                    for (var i = 0, len = params.nodes.length; i < len; i++) {
                        childNodes.push(self.addNode({
                            type:"enable",
                            enabled:false,
                            nodes:[
                                params.nodes[i]
                            ]
                        }));
                    }

                    // The currently active child node
                    var currentNode;

                    // We'll get an intersection update first..
                    body.on("intersect",
                        function (intersect) {
                            if (currentNode) {
                                switch (intersect) {
                                    case 0: // Completely outside frustum
                                        currentNode.setEnabled(false);
                                        break;
                                    case 1: // Partially inside frustum
                                        currentNode.setEnabled(true);
                                        break;
                                    case 2: // Completely inside frustum
                                        currentNode.setEnabled(true);
                                        break;
                                }
                            }
                        });

                    // .. then we'll only get a 2D size update if
                    // we're intersecting the view frustum.
                    body.on("canvasSize",
                        function (canvasSize) {

                            if (currentNode) {

                                // We only get a 2d size update when the size has changed,
                                // so safe to say we'll not be immediately re-enabling
                                // the currently enabled child node

                                currentNode.setEnabled(false);
                            }
//
                            if (canvasSize == -1) {
                                // All Culled
                                return;
                            }

                            // Enable the appropriate child, if any,
                            // for the boundary's projected 2D size

                            for (var i = sizes.length - 1; i >= 0; i--) {
                                if (canvasSize >= sizes[i]) {
                                    currentNode = childNodes[i];
                                    currentNode.setEnabled(true);
                                    return;
                                }
                            }
                        });
                }
            });
    }
});