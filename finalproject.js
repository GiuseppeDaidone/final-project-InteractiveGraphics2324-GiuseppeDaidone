// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// Transformation matrix
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	
	sinX = Math.sin(rotationX);
	cosX = Math.cos(rotationX);
	var rotationXMatrix = [
		1, 0, 0, 0,
		0, cosX, -sinX, 0,
		0, sinX, cosX, 0,
		0, 0, 0, 1
	];
	
	sinY = Math.sin(rotationY);
	cosY = Math.cos(rotationY);
	var rotationYMatrix = [
		cosY, 0, sinY, 0,
		0, 1, 0, 0,
		-sinY, 0, cosY, 0,
		0, 0, 0, 1
	];
	
	var mv = MatrixMult(MatrixMult(trans, rotationXMatrix), rotationYMatrix);
	
	return mv;
}


// Class MeshDrawer
class MeshDrawer
{
	// Constructor
	constructor()
	{
		// Initializations
        this.prog = InitShaderProgram(meshVS, meshFS);
        this.mvp = gl.getUniformLocation(this.prog, 'mvp');
		this.mv = gl.getUniformLocation(this.prog, 'mv');
		this.normalMatrix = gl.getUniformLocation(this.prog, 'normalMatrix');
		this.cameraPos = gl.getUniformLocation(this.prog, 'cameraPos');
        this.vertPos = gl.getAttribLocation(this.prog, 'pos');
        this.texCoordPos = gl.getAttribLocation(this.prog, 'texCoord');
		this.normalPos = gl.getAttribLocation(this.prog, 'normal');

        this.vertbuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();
		this.normalBuffer = gl.createBuffer();
        this.indexbuffer = gl.createBuffer();

        this.meshVertices = [];
        this.meshTexCoords = [];
		this.meshNormals = [];
        this.showTextureFlag = document.getElementById("show-texture").checked;
		this.textureUploaded = false;
        this.swapYZFlag = document.getElementById("swap-yz").checked;

        this.texture = null;
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		// Update the contents of the vertex buffer objects
        this.meshVertices = vertPos;
        this.meshTexCoords = texCoords;
		this.meshNormals = normals;

        // Bind vertex positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.meshVertices), gl.STATIC_DRAW);

        // Bind texture coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.meshTexCoords), gl.STATIC_DRAW);
		
		// Bind vertex normals buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.meshNormals), gl.STATIC_DRAW);
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// Set the uniform parameter(s) of the vertex shader
        const swapUniform = gl.getUniformLocation(this.prog, 'swapYZ');
        gl.useProgram(this.prog);
        gl.uniform1i(swapUniform, swap);
		this.swapYZFlag = swap;
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// WebGL initializations before drawing
        gl.useProgram(this.prog);
        gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
        gl.uniformMatrix4fv(this.mv, false, matrixMV);
        gl.uniformMatrix4fv(this.normalMatrix, false, matrixNormal);
		gl.uniform3fv(this.cameraPos, [0.0, 0.0, 5.0]);

		// Bind vertex positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vertPos);

		// Bind texture coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(this.texCoordPos, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.texCoordPos);

		// Bind texture normal
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(this.normalPos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.normalPos);

		
        // Bind texture
        if(this.texture != null && this.showTextureFlag)
		{
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
        }
		else 
		{
			const showTextureUniform = gl.getUniformLocation(this.prog, 'showTextureFlag');
			gl.uniform1i(showTextureUniform, this.showTextureFlag); // Set proper boolean value based on Show Texture checkbox
			const textureUploaded = gl.getUniformLocation(this.prog, 'textureUploaded');
			gl.uniform1i(textureUploaded, (this.texture != null)); // Set proper boolean value based on texture uploaded or not
		}

		// Set proper boolean value based on Swap Y-Z checkbox
		this.swapYZ( this.swapYZFlag );

		// Draw the mesh
		gl.drawArrays(gl.TRIANGLES, 0, this.meshVertices.length / 3);
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// Bind the texture
		console.log('Setting texture...');
		var texture = gl.createTexture(); // Create a new texture object
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);

		// Set the texture image
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		gl.generateMipmap(gl.TEXTURE_2D);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

		var textureSampler = gl.getUniformLocation(this.prog, 'uSampler');
		if(textureSampler === null)
		{
			console.error('Uniform sampler not found.');
		}
		gl.useProgram(this.prog);
		// Set texture sampler uniform
		gl.uniform1i(textureSampler, 0);

		// Assign the texture object to the class property
		this.texture = texture;
		
		// Set the value of an uploaded texture
		this.textureUploaded = true;
		const textureUploaded = gl.getUniformLocation(this.prog, 'textureUploaded');
		gl.useProgram(this.prog);
		gl.uniform1i(textureUploaded, this.textureUploaded);
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// Set the uniform parameter(s) of the fragment shader to specify if it should use the texture
		const showTextureUniform = gl.getUniformLocation(this.prog, 'showTextureFlag');
        gl.useProgram(this.prog);
        gl.uniform1i(showTextureUniform, show ? 1 : 0);
		const textureUploaded = gl.getUniformLocation(this.prog, 'textureUploaded');
		gl.useProgram(this.prog);
		gl.uniform1i(textureUploaded, this.textureUploaded);
		this.showTextureFlag = show;
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// Set the uniform parameter(s) of the fragment shader to specify the light direction
		const lightDirUniform = gl.getUniformLocation(this.prog, 'lightDirection');
		const lightColorUniform = gl.getUniformLocation(this.prog, 'lightColor');
		gl.useProgram(this.prog);
		gl.uniform3f(lightDirUniform, x, y, z);
		gl.uniform3f(lightColorUniform, 1.0, 1.0, 1.0); // white light
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// Set the uniform parameter(s) of the fragment shader to specify the shininess
		const shininessUniform = gl.getUniformLocation(this.prog, 'shininess');
		if (shininessUniform === null) {
			console.error('Failed to get uniform location for shininess.');
			return;
		}
        gl.useProgram(this.prog);
        gl.uniform1f(shininessUniform, shininess);
	}

	// This method is called to set ambient color
	setAmbientColor(r, g, b) {
		const ambientColorUniform = gl.getUniformLocation(this.prog, 'ambientColor');
		gl.useProgram(this.prog);
		gl.uniform3f(ambientColorUniform, r, g, b);
	}
}

// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
// Mass-spring simulation
function SimTimeStep( dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution )
{
	// Initialize forces array
	var forces = new Array(positions.length);
    for (var i = 0; i < positions.length; i++) {
        forces[i] = new Vec3(0, 0, 0);
    }
	
    // Compute spring forces
    for (var spring of springs) {
        var p0 = spring.p0;
        var p1 = spring.p1;
        var restLength = spring.rest;
        
        var pos0 = positions[p0];
        var pos1 = positions[p1];
        
        var displacement = pos1.copy().sub(pos0);
        var distance = displacement.len();
        var direction = displacement.unit();
        
        var springForce = direction.mul(stiffness * (distance - restLength));
        
        forces[p0].inc(springForce);
        forces[p1].dec(springForce);
    }
    
    // Compute gravitational force
    for (var i = 0; i < positions.length; i++) {
        var velocity = velocities[i];
        
        // Damping force
        var dampingForce = velocity.copy().mul(-damping);
        forces[i].inc(dampingForce);
        
        // Gravity force
        var gravityForce = gravity.copy().mul(particleMass);
        forces[i].inc(gravityForce);
    }
    
    // Update positions and velocities using explicit Euler integration
    for (var i = 0; i < positions.length; i++) {
        var acceleration = forces[i].copy().div(particleMass);
        
        velocities[i].inc(acceleration.mul(dt));
        positions[i].inc(velocities[i].copy().mul(dt));
    }

    // Handle collisions with the box walls
    for (var i = 0; i < positions.length; i++) {
        var pos = positions[i];
        var vel = velocities[i];
        
        for (var axis of ['x', 'y', 'z']) {
            if (pos[axis] < -1) {
                pos[axis] = -1;
                if (vel[axis] < 0) vel[axis] *= -restitution;
            } else if (pos[axis] > 1) {
                pos[axis] = 1;
                if (vel[axis] > 0) vel[axis] *= -restitution;
            }
        }
    }
}

// Function to find the closest top-left and top-right corners
function findClosestCorners(positions) {
    if (positions.length === 0) {
        return null; // No positions provided
    }
    
    // Initialize variables to track min and max coordinates
    let minX = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxZ = -Infinity;
    let minCorner = null, maxCorner = null, posMinCorner = null, posMaxCorner = null;

    // Iterate through positions to find min and max x and z
    for (let i = 0; i < positions.length; i++) {
        let pos = positions[i];

        // Find min x and z
        if (pos.x < minX) {
            minX = pos.x;
            minZ = pos.z;
            minCorner = pos;
			posMinCorner = i;
        } else if (pos.x === minX && pos.z < minZ) {
            minZ = pos.z;
            minCorner = pos;
			posMinCorner = i;
        }

        // Find max x and min z
        if (pos.z < minZ) {
            minZ = pos.z;
            minCorner = pos;
			posMinCorner = i;
        }

        if (pos.x > maxX) {
            maxX = pos.x;
            maxZ = pos.z;
            maxCorner = pos;
			posMaxCorner = i;
        } else if (pos.x === maxX && pos.z < maxZ) {
            maxZ = pos.z;
            maxCorner = pos;
			posMaxCorner = i;
        }
    }

    // Return an object with the closest corners
    return {
        minCorner: minCorner,
        maxCorner: maxCorner,
		posMinCorner: posMinCorner,
		posMaxCorner: posMaxCorner
    };
}

// Cloth mass-spring simulation
function SimClothTimeStep( dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution )
{
	// Find closest right and left corner
	const closestCorners = findClosestCorners(positions);
	console.log(closestCorners);
	
	// Constants
    const friction = 0.99; // Friction spring effect
    const accuracy = 5; // Number of constraint resolution iterations (wind effect)
	
	// Get initial positions corners
	// Modify the cell positions' value accordingly with the cell found with findClosestCorners function
	const posLeftCorner = positions[20].copy();
    const posRightCorner = positions[24].copy();
	
	// Initialize forces array
	var forces = new Array(positions.length);
    for (var i = 0; i < positions.length; i++) {
        forces[i] = new Vec3(0, 0, 0);
    }
	
    // Compute spring forces
    for (const spring of springs) {
        const p0 = spring.p0;
        const p1 = spring.p1;
        const restLength = spring.rest;
        
        const pos0 = positions[p0];
        const pos1 = positions[p1];
        
        const displacement = pos1.copy().sub(pos0);
        const distance = displacement.len();
        const direction = displacement.unit();
        
        const springForce = direction.mul(stiffness * (distance - restLength));
        
        forces[p0].inc(springForce);
        forces[p1].dec(springForce);
    }
    
    // Compute gravitational force
    for (let i = 0; i < positions.length; i++) {
        const velocity = velocities[i];
        
        // Damping force
        const dampingForce = velocity.copy().mul(-damping);
        forces[i].inc(dampingForce);
        
        // Gravity force
        const gravityForce = gravity.copy().mul(particleMass);
        forces[i].inc(gravityForce);
    }
    
    // Update positions and velocities using explicit Euler integration
    for (let i = 0; i < positions.length; i++) {
		
        const acceleration = forces[i].copy().div(particleMass);
        
        velocities[i].inc(acceleration.mul(dt));
		positions[i].inc(velocities[i].copy().mul(dt));
		
		// Apply friction
        velocities[i].mul(friction);
    }

    // Handle collisions with the box walls
    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const vel = velocities[i];
        
        for (const axis of ['x', 'y', 'z']) {
            if (pos[axis] < -1) {
                pos[axis] = -1;
                if (vel[axis] < 0) vel[axis] *= -restitution;
            } else if (pos[axis] > 1) {
                pos[axis] = 1;
                if (vel[axis] > 0) vel[axis] *= -restitution;
            }
        }
    }
	
	// Constraint resolution for springs
    for (let a = 0; a < accuracy; a++) {
        for (const spring of springs) {
            const { p0, p1, rest } = spring;
            const pos0 = positions[p0];
            const pos1 = positions[p1];
            const displacement = pos1.copy().sub(pos0);
            const distance = displacement.len();
            const difference = (distance - rest) / distance;

            const correction = displacement.mul(difference * 0.5);
            pos0.inc(correction);
            pos1.dec(correction);
        }
    }
	
	// Pin the two corners
	// Modify the cell positions' value accordingly with the cell found with findClosestCorners function
    positions[20] = posLeftCorner;
    positions[24] = posRightCorner;
}

// Vertex shader source code for mesh rendering
var meshVS = `
	attribute vec3 pos;
	attribute vec2 texCoord;
	attribute vec3 normal;
	varying vec2 vTexCoord;
	varying vec3 vNormal;
	varying vec3 vFragPos;
	uniform mat4 mvp;
	uniform mat4 mv;
	uniform vec3 cameraPos;
	uniform bool swapYZ;

	void main() {
		vec3 newPos = pos;
		if (swapYZ) {
			newPos.yz = newPos.zy;
		}
		gl_Position = mvp * vec4(newPos, 1.0);
		vTexCoord = texCoord;
		vNormal = mat3(mv) * normal;
		vFragPos = vec3(mv * vec4(newPos, 1.0));
	}
`;

// Fragment shader source code for mesh rendering
var meshFS = `
	precision mediump float;

	varying vec2 vTexCoord;
	varying vec3 vNormal;
	varying vec3 vFragPos;

	uniform sampler2D uSampler;
	uniform bool showTextureFlag;
	uniform bool textureUploaded;
	uniform vec3 cameraPos;
	uniform vec3 lightDirection;
	uniform vec3 lightColor;
	uniform float shininess;
	uniform vec3 ambientColor;

	void main() {
		// Normalize the input normal vector
		vec3 norm = normalize(vNormal);
		
		// Compute the light direction and normalize it
		vec3 lightDir = normalize(lightDirection);

		// Calculate ambient component
		vec3 ambient = ambientColor;

		// Calculate diffuse component
		float diff = max(dot(norm, lightDir), 0.0);
		vec3 diffuse = diff * lightColor;

		// Calculate view direction
		vec3 viewDir = normalize(cameraPos - vFragPos);

		// Calculate reflect direction for specular component
		vec3 reflectDir = reflect(-lightDir, norm);
		float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
		vec3 specular = spec * lightColor;

		// Combine all components
		vec3 lighting = ambient + diffuse + specular;

		// Get the base color from the texture if it is used
		vec3 baseColor = vec3(1.0); // default to white
		if (showTextureFlag && textureUploaded) {
			baseColor = texture2D(uSampler, vTexCoord).rgb;
		}

		// Final color is the product of the base color and the lighting
		vec3 finalColor = baseColor * lighting;

		gl_FragColor = vec4(finalColor, 1.0);
	}
`;
