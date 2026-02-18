#version 300 es
precision highp float;

uniform sampler2D texture0; // Main Image
uniform sampler2D texture1; // Vignette
uniform sampler2D texture2; // Noise
uniform sampler2D texture3; // Scanlines (RGB Mesh)

uniform float u_time;
uniform float u_random;
uniform vec2 u_redOffset;   
uniform vec2 u_blueOffset;
uniform vec2 u_resolution; 

// Toggles & Params
uniform float u_enableScanlines;
uniform float u_scanlineScale; 

uniform float u_enableVignette;
uniform float u_vignetteIntensity; 

uniform float u_enableNoise;
uniform float u_noiseIntensity; 

uniform float u_enableRoll;
uniform float u_rollSpeed;     

uniform float u_bendFactor;    

in vec2 texCoords;
out vec4 outColor;

vec2 crtCoords(vec2 uv, float bendFactor) {
    uv -= 0.5;
    uv *= 2.0;
    vec2 offset = pow(abs(uv.yx) * bendFactor, vec2(2.0));
    uv *= 1.0 + offset;
    uv /= 2.0;
    return uv + 0.5;
}

void main() {
    vec2 uv = texCoords;
    
    vec2 crtUV = crtCoords(texCoords, u_bendFactor);

    // Transparent pixels outside the curved screen
    if (crtUV.x < 0.0 || crtUV.x > 1.0 || crtUV.y < 0.0 || crtUV.y > 1.0) {
        outColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }

    // RGB Jitter
    float r = texture(texture0, crtUV + u_redOffset).r;
    float g = texture(texture0, crtUV).g;
    float b = texture(texture0, crtUV + u_blueOffset).b;
    vec4 color = vec4(r, g, b, 1.0);

    // Auxiliary Textures
    vec4 vignetteColor = texture(texture1, texCoords);
    
    // Noise: Scale the UVs by resolution so the grain is 1:1 pixel perfect
    vec2 noiseUV = uv * (u_resolution / 256.0);
    vec4 noiseColor = texture(texture2, noiseUV + vec2(u_random));
    
    // --- SCANLINE SAMPLING ---
    vec2 scanUV = crtUV * (u_resolution / u_scanlineScale);
    vec4 scanlineColor = texture(texture3, scanUV);

    // 1. Apply Vignette
    if (u_enableVignette > 0.5) {
        color = mix(color, color * vignetteColor, u_vignetteIntensity);
    }

    // 2. Apply Noise
    if (u_enableNoise > 0.5) {
        color = mix(color, noiseColor, u_noiseIntensity); 
    }
    
    // 3. Apply RGB Scanlines
    if (u_enableScanlines > 0.5) {
        color.rgb = mix(color.rgb, scanlineColor.rgb, scanlineColor.a * 0.6);
    }

    // 4. Apply Rolling Bar
    if (u_enableRoll > 0.5) {
        float roll = sin(crtUV.y * 3.0 - u_time * u_rollSpeed);
        roll = smoothstep(0.8, 1.0, roll); 
        color.rgb = mix(color.rgb, color.rgb + 0.15, roll * 0.3);
    }
    
    // Gamma / Vintage contrast
    color.rgb = pow(color.rgb, vec3(0.9));

    outColor = color;
}
