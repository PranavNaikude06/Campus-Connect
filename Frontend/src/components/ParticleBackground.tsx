import { useEffect, useRef } from 'react';

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // The WebGL initialization code is exactly as requested, inside the useEffect.
    const gl = (canvas.getContext('webgl', { antialias: false }) || 
                canvas.getContext('experimental-webgl', { antialias: false })) as WebGLRenderingContext | null;
    
    if (!gl) {
      console.error('WebGL is unsupported');
      return;
    }

    const MAX_DROPS = 32;

    const VS = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main(){
        v_uv = a_pos * 0.5 + 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    const FS = `
      precision highp float;
      #define MAX_DROPS 32

      uniform vec2 u_res;
      uniform float u_time;
      uniform vec4 u_drops[MAX_DROPS];
      uniform int u_ndrop;

      varying vec2 v_uv;

      vec2 hash2(vec2 p){
        p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
        return -1.0 + 2.0*fract(sin(p)*43758.5453);
      }
      float noise(vec2 p){
        vec2 i=floor(p), f=fract(p), u=f*f*(3.0-2.0*f);
        return mix(mix(dot(hash2(i),f), dot(hash2(i+vec2(1,0)),f-vec2(1,0)),u.x),
                   mix(dot(hash2(i+vec2(0,1)),f-vec2(0,1)), dot(hash2(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);
      }
      float fbm(vec2 p){
        float v=0.0, a=0.5;
        mat2 m = mat2(1.6,1.2,-1.2,1.6);
        for(int i=0;i<5;i++){ v+=a*noise(p); p=m*p; a*=0.5; }
        return v;
      }

      float ripple(vec2 uv, vec2 src, float age){
        vec2 asp = vec2(u_res.x/u_res.y, 1.0);
        float d = length((uv - src) * asp);
        float speed = 0.55;
        float freq = 28.0;
        float waveR = age * speed;
        float decay = exp(-age * 1.8) * smoothstep(0.0, 0.06, waveR);
        float ring = exp(-pow((d - waveR)*freq, 2.0));
        // Reduced intensity from 0.032 to 0.018 for a softer, more subtle effect
        return sin(d * freq - age * 14.0) * ring * decay * 0.018;
      }

      void main(){
        float t = u_time;
        float h = 0.0, hx = 0.0, hy = 0.0, eps = 0.003;

        for(int i = 0; i < MAX_DROPS; i++){
          if(i >= u_ndrop) break;
          vec2 pos = u_drops[i].xy;
          float age = t - u_drops[i].z;
          if(age < 0.0 || age > 3.5) continue;
          h  += ripple(v_uv, pos, age);
          hx += ripple(v_uv+vec2(eps,0), pos, age);
          hy += ripple(v_uv+vec2(0,eps), pos, age);
        }

        vec2 norm = vec2(hx - h, hy - h) / eps;
        vec2 refUV = v_uv + norm * 1.4;

        vec2 uv2 = (refUV - 0.5) * vec2(u_res.x/u_res.y, 1.0);
        float s = t * 0.14;
        vec2 q  = vec2(fbm(uv2 + s*0.5), fbm(uv2 + vec2(5.2,1.3) + s*0.4));
        vec2 r  = vec2(fbm(uv2 + 2.0*q + vec2(1.7,9.2) + s*0.3), fbm(uv2 + 2.0*q + vec2(8.3,2.8) + s*0.25));
        float f = fbm(uv2 + 2.5*r + s*0.2);
        f = smoothstep(-0.05, 1.05, f);

        vec3 col = mix(vec3(0.010,0.018,0.055), vec3(0.06,0.01,0.22), f);
        col = mix(col, vec3(0.12,0.03,0.58), pow(f,1.8)*0.72);
        col = mix(col, vec3(0.0,0.82,0.98), pow(max(f-0.52,0.0)*2.2, 2.2)*0.60);
        col = mix(col, vec3(1.0,0.67,0.0), pow(max(f-0.80,0.0)*5.0, 3.0)*0.28);

        float spec = pow(max(dot(normalize(vec3(norm, 0.5)), normalize(vec3(0.3,0.4,1.0))),0.0), 22.0);
        col += vec3(0.5,0.95,1.0) * spec * 0.6;
        col += vec3(0.0, 0.7, 1.0) * smoothstep(0.004, 0.018, abs(h)) * 0.4;

        float vig = v_uv.x * v_uv.y * (1.0-v_uv.x) * (1.0-v_uv.y);
        col *= pow(clamp(vig * 16.0, 0.0, 1.0), 0.18) * 0.82;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    function compile(type: number, src: string) {
      if (!gl) return null;
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
      return s;
    }

    const prog = gl.createProgram();
    if (!prog || !gl) return;
    
    const vs = compile(gl.VERTEX_SHADER, VS);
    const fs = compile(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uNdrop = gl.getUniformLocation(prog, 'u_ndrop');
    const uDrops: (WebGLUniformLocation | null)[] = [];
    for(let i=0; i<MAX_DROPS; i++) {
        uDrops.push(gl.getUniformLocation(prog, `u_drops[${i}]`));
    }

    function resize() {
      if (!canvas || !gl) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    
    // Resize initially and bind event
    resize();
    window.addEventListener('resize', resize);

    const drops = new Array(MAX_DROPS).fill(null).map(()=>({x:0, y:0, t:-999}));
    let dropHead = 0;

    const start = performance.now();
    function now() { return (performance.now() - start) * 0.001; }

    function addDrop(px: number, py: number) {
      drops[dropHead] = { x: px / window.innerWidth, y: 1.0 - py / window.innerHeight, t: now() };
      dropHead = (dropHead + 1) % MAX_DROPS;
    }

    /* throttle drops while dragging so we don't flood the buffer */
    let lastDrop = 0;
    function onMove(px: number, py: number) {
      const n = now();
      if(n - lastDrop > 0.055){ /* ~18 drops/sec max */
        addDrop(px, py);
        lastDrop = n;
      }
    }

    // EVENT LISTENERS STORED AS NAMED FUNCTIONS FOR CLEANUP
    const handleMouseMove = (e: MouseEvent) => {
      onMove(e.clientX, e.clientY);
      
      // Update custom cursor
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px';
        cursorRef.current.style.top = e.clientY + 'px';
      }
    };
    const handleClick = (e: MouseEvent) => addDrop(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const handleTouchStart = (e: TouchEvent) => addDrop(e.touches[0].clientX, e.touches[0].clientY);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('touchmove', handleTouchMove as any, { passive: false });
    window.addEventListener('touchstart', handleTouchStart as any, { passive: true });

    let reqId: number;
    function frame() {
      if (!canvas || !gl) return;
      const t = now();
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);

      /* upload drops — only active ones count */
      let nActive = 0;
      for(let i=0; i<MAX_DROPS; i++){
        const d = drops[i];
        const age = t - d.t;
        if(age >= 0 && age < 3.5){
          gl.uniform4f(uDrops[nActive], d.x, d.y, d.t, 0.0);
          nActive++;
        }
      }
      gl.uniform1i(uNdrop, nActive);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      reqId = requestAnimationFrame(frame);
    }
    
    // Start animation loop
    reqId = requestAnimationFrame(frame);

    // CLEANUP FUNCTION
    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('touchmove', handleTouchMove as any);
      window.removeEventListener('touchstart', handleTouchStart as any);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0, 
          display: 'block',
          cursor: 'none'
        }}
      />
      <div
        ref={cursorRef}
        id="cur"
        style={{
          position: 'fixed',
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: 'rgba(0,229,255,0.7)',
          boxShadow: '0 0 18px 4px rgba(0,229,255,0.5)',
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate(-50%,-50%)',
          transition: 'transform 0.05s',
          mixBlendMode: 'screen'
        }}
      />
    </>
  );
}
