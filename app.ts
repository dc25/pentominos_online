/// <reference path="jquery.d.ts" />
/// <reference path="three.d.ts" />
/// <reference path="tween.js.d.ts" />

var puzzleScene: PuzzleScene;

var position;
var tween;
var backtween;
var pausetween0;
var pausetween1;

function initTween() {

    var rotateTime: number = 3000;
    var pauseTime: number = 2000;

    position = {rotation: 0 };
    tween = new TWEEN.Tween(position)
        .to({ rotation: 180 }, rotateTime)
        .easing(TWEEN.Easing.Back.InOut)
        .onComplete(function () { puzzleScene.loadNextSolution() });

    backtween = new TWEEN.Tween(position)
        .to({ rotation: 0 }, rotateTime)
        .easing(TWEEN.Easing.Back.InOut)
        .onComplete(function () { puzzleScene.loadNextSolution() });

    pausetween0 = new TWEEN.Tween({})
        .to({}, pauseTime);

    pausetween1 = new TWEEN.Tween({})
        .to({}, pauseTime);

    pausetween0.chain(tween);
    tween.chain(pausetween1);
    pausetween1.chain(backtween);
    backtween.chain(pausetween0);

    pausetween0.start();
}

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    puzzleScene.update();
    puzzleScene.renderScene();
}

declare var Detector: any;

var assignedColors = [];

var availableColors = [
    "aqua",
    "blue",
    "blueviolet",
    "brown",
    "burlywood",
    "cadetblue",
    "chartreuse",
    "chocolate",
    "coral",
    "cornflowerblue",
    "crimson",
    "darkblue"];

function getColor(label) {
    if (!(label in assignedColors))
    {
        assignedColors[label] = availableColors.shift();
    }
    return assignedColors[label];
}

class PuzzleScene {

    private renderer;
    private scene;
    private camera;

    private backMeshIndex: number;
    private backSolutionIndex: number;
    private solutions;

    private meshes: { [element: string]: THREE.Mesh; }[];
    private counterKey: string = "counter";


    private colorMesh(mesh, solution):void {
        for (var s = 0; s < solution.length; s++)
        {
            var row = solution[s];
            var useColor = getColor(row[row.length - 1]);
            for (var i = 0; i < row.length - 1; i++)
            {
                var material = <THREE.MeshBasicMaterial>mesh[row[i]].material;
                material.color.set(useColor);
            }
        }
    }

    private initSolutionMeshes(solution, meshIndex: number): void {
        var mesh = this.meshes[meshIndex];
        for (var s = 0; s < solution.length; s++)
        {
            var row = solution[s];
            for (var i = 0; i < row.length - 1; i++)
            {
                // 1. Instantiate the geometry object
                // 2. Add the vertices
                // 3. Define the faces by setting the vertices indices
                var squareGeometry = new THREE.Geometry();

                var border: number = 0.02;
                squareGeometry.vertices.push(new THREE.Vector3(0.0 + border, 0.0 + border, 0.0));
                squareGeometry.vertices.push(new THREE.Vector3(1.0 - border, 0.0 + border, 0.0));
                squareGeometry.vertices.push(new THREE.Vector3(1.0 - border, 1.0 - border, 0.0));
                squareGeometry.vertices.push(new THREE.Vector3(0.0 + border, 1.0 - border, 0.0));
                if (meshIndex == 0) {
                    squareGeometry.faces.push(new THREE.Face4(0, 1, 2, 3));
                } else {
                    squareGeometry.faces.push(new THREE.Face4(3, 2, 1, 0));
                }

                // Create a mesh and insert the geometry and the material. 
                var squareMesh = new THREE.Mesh(squareGeometry);

                // save for later animation
                mesh[row[i]] = squareMesh;
                squareMesh.matrixAutoUpdate = false;
                this.scene.add(squareMesh);
            }
        }
        this.colorMesh(mesh, solution);
    }

    private addText(meshIndex: number): void {
        // create a canvas element
        var canvas1 = document.createElement('canvas');
        canvas1.height = 200;
        canvas1.width = 400;

        var context1 = canvas1.getContext('2d');
        context1.font = "Bold 40px Arial";
        context1.fillStyle = "rgba(255,255,255,0.95)";
        var textOffset = 0.05;
        context1.fillText('Hello!', (0.5 + textOffset) * canvas1.width, (0.5 - textOffset) * canvas1.height);
        
        // canvas contents will be used for a texture
        var texture1 = new THREE.Texture(canvas1) 
        texture1.needsUpdate = true;

        var material1 = new THREE.MeshBasicMaterial( {map: texture1, side: (meshIndex == 0) ? THREE.FrontSide : THREE.BackSide } );

        material1.transparent = true;

        var planeGeometry = new THREE.PlaneGeometry(2, 2);

        var mesh1 = new THREE.Mesh(
            planeGeometry,
            material1
          );
        mesh1.matrixAutoUpdate = false;

        
        this.scene.add(mesh1);
        var mesh = this.meshes[meshIndex];
        mesh[this.counterKey] = mesh1;
    }

    public initializeScene(data) {

        this.solutions = data.solutions
        
        this.meshes = [];
        this.meshes[0] = {};
        this.meshes[1] = {};

        if (Detector.webgl) {
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
        } else {
            this.renderer = new THREE.CanvasRenderer();
        }

        // Set the background color of the renderer to black, with full opacity
        this.renderer.setClearColor(0x000000, 1);

        // Get the size of the inner window (content area) to create a full size renderer
        var canvasWidth = window.innerWidth;
        var canvasHeight = window.innerHeight;

        // Set the renderers size to the content areas size
        this.renderer.setSize(canvasWidth, canvasHeight);

        // Get the DIV element from the HTML document by its ID and 
        // append the renderers DOM object to it
        document.getElementById("WebGLCanvas").appendChild(this.renderer.domElement);

        // Create the scene, in which all objects are stored (e. g. camera, 
        // lights, geometries, ...)
        this.scene = new THREE.Scene();

        // After definition, the camera has to be added to the scene.
        this.camera = new THREE.PerspectiveCamera(45, canvasWidth / canvasHeight, 1, 100);
        this.camera.position.set(0, 0, 10);
        this.camera.lookAt(this.scene.position);
        this.scene.add(this.camera);

        this.initSolutionMeshes(this.solutions[0], 0);
        this.initSolutionMeshes(this.solutions[1], 1);

        this.backSolutionIndex = 1;
        this.backMeshIndex = 1;

        this.addText(0);
        this.addText(1);

    }

    private getPosition(id: string): THREE.Vector3 {
        var x: number;
        var y: number;
        var z: number;
        
        if (id == this.counterKey) {
            x = 0;
            y = 0;
            z = 0.01;
        } else {
            var coord_strings = id.split(",");
            x = parseInt(coord_strings[0]);
            y = parseInt(coord_strings[1]);
            z = 0.0;
        }
        return new THREE.Vector3(x - 5, y - 3, z);
    }

    public update(): void {
        var rotationAxis = new THREE.Vector3(1.0, 1.0, 0.0);
        rotationAxis.normalize();
        var rotationMatrix: THREE.Matrix4 = new THREE.Matrix4;
        rotationMatrix.makeRotationAxis(rotationAxis, position.rotation / 180.0 * Math.PI);

        for (var meshkey in this.meshes) {
            if (!this.meshes.hasOwnProperty(meshkey)) 
                continue;
            var mesh = this.meshes[meshkey];
            for (var squarekey in mesh) {
                if (!mesh.hasOwnProperty(squarekey)) 
                    continue;
                var square = mesh[squarekey];
                var pos = this.getPosition(squarekey);

                square.matrix.copy(rotationMatrix);
                square.matrix.setPosition(pos);
                square.updateMatrixWorld(true);  // why is this necessary?
            }
        }
    }

    public loadNextSolution(): void {
        this.backMeshIndex = (this.backMeshIndex + 1) % 2;
        this.backSolutionIndex = (this.backSolutionIndex + 1) % this.solutions.length;

        var mesh = this.meshes[this.backMeshIndex];
        var solution = this.solutions[this.backSolutionIndex];
        this.colorMesh(mesh, solution);
    }

    public renderScene():void {
        this.renderer.render(this.scene, this.camera);
    }
    
}

function showSolutions() {
    $.getJSON('solutions.json', function (data) {
        puzzleScene = new PuzzleScene;
        puzzleScene.initializeScene(data);
        initTween();
        animate();
    });
}

$(document).ready(showSolutions)

