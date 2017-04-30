(function() {
  var configure = {
    name: 'ruledSurface',
    precision: 10,
    resolution: 120,
    type: 'circle',
    type_down: 'circle',
    parameter : {
    	dense: { description: '密度',
		value: 3,
		min: 1, max: 6, step: 1,
	},
    	height: { description: '距離',
		value: 3,
		min: 0, max: 5, step: 0.05,
	},
    	angle: { description: '捻れ',
		value: 0.3,
		min: 0, max: 0.5, step: 0.05,
	},
    	slide: { description: '上面ズレ',
		value: 0,
		min: -1, max: 1, step: 0.05,
	},
    	axisx: { description: '底面傾きa',
		value: 0,
		min: 0, max: 1, step: 0.05,
	},
    	axisz: { description: '底面傾きb',
		value: 0,
		min: 0, max: 1, step: 0.05,
	},
    	enlong: { description: '伸し',
		value: 0,
		min: 0, max: 2, step: 0.05,
	},
    	punctured_up: { description: '上面潰し',
		value: 1,
		min: 0, max: 1, step: 0.05,
	},
    	punctured_down: { description: '下面潰し',
		value: 1,
		min: 0, max: 1, step: 0.05,
	},
    },
  };
  (function(exports) {
    exports.main = main;
    exports.obj = obj;
    exports.parameter = configure.parameter;

    function obj(param, type, type_down) {
      if ( type_down === null ) {
	type_down = type;
      }
      var curve1 = [];
      var curve2 = [];
      for (var c1 = 0; c1 < configure.resolution; c1++) {
        var theta = 2 * Math.PI * (-0.5 + c1 / configure.resolution);
        var x,y,z;
        if ( type === 'circle' ) {
          x = Math.cos(theta);
          y = theta;
          z = Math.sin(theta);
        } else {
          x = theta;
          y = theta;
          z = 0;
        }
	x = x* param.punctured_up;
	y = y* param.enlong;
        var xyz = [x, y, z];

        var axisx = param.axisx;
        var axisz = param.axisz;
	var axscale;
	if (axisx === 0 || axisz == 0 ) {
	  axscale = 1;
	} else if (axisz < axisx ) {
	  axscale = Math.cos(Math.atan2(axisz,axisx));
	} else {
	  axscale = Math.cos(Math.atan2(axisx,axisz));
	}
        axisx *= axscale;
        axisz *= axscale;
        var axislenlen = (axisx*axisx+axisz*axisz);
        if (axislenlen > 1 ) { axislenlen=1;}
        var axisy;
        if ( axislenlen <= 1 && axislenlen > 0.01 ) {
          axisy = Math.sqrt(1-axislenlen);
          var axis = [axisx, axisy, axisz];
	  var rotanglecos = dot(axis,[0,1,0]);
	  var rotangle;
          if (rotanglecos > 1 ) { rotanglecos=1;}
          if (rotanglecos < -1 ) { rotanglecos=-1;}
	  rotangle = Math.acos(rotanglecos)/(2*Math.PI);
	  var rotaxis = cross(axis,[0,1,0]);
          xyz = rotate(xyz, rotaxis ,rotangle);
        }
        curve1.push([xyz[0].toFixed(configure.precision), xyz[1].toFixed(configure.precision), xyz[2].toFixed(configure.precision)]);
      }
      for (var c2 = 0; c2 < configure.resolution; c2++) {
        var theta = 2 * Math.PI * (-0.5 + c2 / configure.resolution);
        var x,y,z;
        if ( type_down === 'circle' ) {
          x = Math.cos(theta);
          y = theta;
          z = Math.sin(theta);
        } else {
          x = 0;
          y = theta;
          z = theta;
        }
	z = z* param.punctured_down;
	y = y* param.enlong;
        var xyz = [x, y, z];
        xyz = rotate(xyz, [0,1,0] ,param.angle);
        xyz[0] += 3*(param.slide);
        xyz[1] += param.height;
        
        curve2.push([xyz[0].toFixed(configure.precision), xyz[1].toFixed(configure.precision), xyz[2].toFixed(configure.precision)]);
      }

      var objArray = [];
      for (var ci = 0; ci < configure.resolution; ci++) {
        objArray.push('v ' + curve1[ci].join(' '));
        objArray.push('v ' + curve2[ci].join(' '));
      }
      for (var ci = 0; ci < configure.resolution; ci++) {
	if ( ci%(param.dense*2) !== 0) {
	  continue;
	}
        var di = (ci + 1) % configure.resolution;
        if ( type === 'line' || type_down === 'line') {
          if ( di===0 ) {
            continue;
          }
        } else {
          // nop
        }
        var va = 2 * ci + 1;
	var vb = 2 * ci + 1 + 1;
	var vc = 2 * di + 1;
	var vd = 2 * di + 1 + 1;
        var face0 = [va, vb, vc];
        var face1 = [vc, vb, vd];
        var face2 = [vb, va, vd];
        var face3 = [vd, va, vc];
        objArray.push('f ' + face0.join(' '));
        objArray.push('f ' + face1.join(' '));
        objArray.push('f ' + face2.join(' '));
        objArray.push('f ' + face3.join(' '));
      }
      return objArray.join('\n');

      function rotate(xyz, ax, angle) {
        var axisnorm = Math.sqrt(ax[0] * ax[0] + ax[1] * ax[1] + ax[2] * ax[2]);
        if (axisnorm < 0.001) {
          return;
        }
        var axis = [ax[0]/axisnorm,ax[1]/axisnorm,ax[2]/axisnorm];
        var ux = axis[0] * xyz[0];
        var uy = axis[0] * xyz[1];
        var uz = axis[0] * xyz[2];
        var vx = axis[1] * xyz[0];
        var vy = axis[1] * xyz[1];
        var vz = axis[1] * xyz[2];
        var wx = axis[2] * xyz[0];
        var wy = axis[2] * xyz[1];
        var wz = axis[2] * xyz[2];
        var si = Math.sin(2 * Math.PI * angle);
        var co = Math.cos(2 * Math.PI * angle);
        var nx = (axis[0] * (ux + vy + wz) + (x * (axis[1] * axis[1] + axis[2] * axis[2]) - axis[0] * (vy + wz)) * co + (-wy + vz) * si);
        var ny = (axis[1] * (ux + vy + wz) + (y * (axis[0] * axis[0] + axis[2] * axis[2]) - axis[1] * (ux + wz)) * co + (wx - uz) * si);
        var nz = (axis[2] * (ux + vy + wz) + (z * (axis[0] * axis[0] + axis[1] * axis[1]) - axis[2] * (ux + vy)) * co + (-vx + uy) * si);
        return [nx,ny,nz];
      }
      function dot (x,y) {
        return (x[0]*y[0]+x[1]*y[1]+x[2]*y[2]);
      }
      function cross (x,y) {
        return [
		x[1]*y[2]-x[2]*y[1],
		x[2]*y[0]-x[0]*y[2],
		x[0]*y[1]-x[1]*y[0],
	];
      }
    }
    function main() {
      console.log(obj());
    }
  })(typeof exports === 'undefined' ? this[configure.name] = {} : exports);
  if (typeof exports !== 'undefined') {
    if (!(/[^\/]+$/.test(process.argv[1].replace(new RegExp(configure.name + ".js$"), "")))) {
      exports.main();
    }
  }
})();

