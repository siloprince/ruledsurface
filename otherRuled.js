(function() {
  var configure = {
    name: 'ruledSurface',
    precision: 10,
    resolution: 480,
    type: 'conoid',
    parameter : {
    	dense: { description: '密度',
		value: 2,
		min: 1, max: 6, step: 1,
	},
    	param_a: { description: 'パラメタa',
		value: 0,
		min: 0, max: 1, step: 0.05,
	},
    	param_b: { description: 'パラメタb',
		value: 0,
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
	if ( type === 'mobius' ) {
          x = (1-Math.cos(theta))*Math.cos(2*theta);
          y = Math.sin(theta);
          z = (1-Math.cos(theta))*Math.sin(2*theta);
        } else {
	  // conoid
          x = 0;
          y = Math.sin(2*theta);
          z = 0;
        }
        var xyz = [x, y, z];
        curve1.push([xyz[0].toFixed(configure.precision), xyz[1].toFixed(configure.precision), xyz[2].toFixed(configure.precision)]);
      }
      for (var c2 = 0; c2 < configure.resolution; c2++) {
        var theta = 2 * Math.PI * (-0.5 + c2 / configure.resolution);
        var x,y,z;
	if ( type === 'mobius' ) {
          theta -= Math.PI*(1-param.param_a*0.8);
          x = (1-Math.cos(theta))*Math.cos(2*theta);
          y = Math.sin(theta);
          z = (1-Math.cos(theta))*Math.sin(2*theta);
        } else {
          x = Math.cos(theta);
          y = Math.sin(2*theta);
          z = Math.sin(theta);
	}
        var xyz = [x, y, z];
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

