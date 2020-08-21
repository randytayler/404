var bwidth = 4096;
var bheight = 4096;

function insideEllipse(rx, ry, r1, r2, mx, my){
	if (((((rx-mx)*(rx-mx))/(r1*r1)) + (((ry-my)*(ry-my))/(r2*r2))) < 1) return true;
	return false;
}

function nebula(rr,rg,rb,x,y,lum){
	var c=document.getElementById('nebula');
	var ctx=c.getContext('2d');

	var nwidth=1000;
	var nheight=1000;
	// nebula
	for (i=0; i<=1000; i++){
		var rx = Math.round(Math.random()*nwidth);
		var ry = Math.round(Math.random()*nheight);
		if (insideEllipse(rx,ry,200,200,x,y)){
			var radius = Math.round(Math.random()*6);
			var r=Math.round(Math.random()*rr)+lum;
			var g=Math.round(Math.random()*rg)+lum;
			var b=Math.round(Math.random()*rb)+lum;
			var a=Math.random()/10;
			ctx.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
			ctx.beginPath();
			ctx.arc(rx,ry,radius,0, 2*Math.PI,false);
			ctx.fill();
		}
	}
	for (i=0; i<=2000; i++){
		var rx = Math.round(Math.random()*nwidth);
		var ry = Math.round(Math.random()*nheight);
		if (insideEllipse(rx,ry,150,150,x,y)){
			var radius = Math.round(Math.random()*3);
			var r=Math.round(Math.random()*rr)+lum;
			var g=Math.round(Math.random()*rg)+lum;
			var b=Math.round(Math.random()*rb)+lum;
			var a=Math.random()/5;
			ctx.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
			ctx.beginPath();
			ctx.arc(rx,ry,radius,0, 2*Math.PI,false);
			ctx.fill();
		}
	}

	for (i=0; i<=2000; i++){
		var rx = Math.round(Math.random()*nwidth);
		var ry = Math.round(Math.random()*nheight);
		if (insideEllipse(rx,ry,100,100,x,y)){
			var radius = Math.round(Math.random()*3);
			var r=Math.round(Math.random()*rr)+lum;
			var g=Math.round(Math.random()*rg)+lum;
			var b=Math.round(Math.random()*rb)+lum;
			var a=Math.random()/5;
			ctx.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
			ctx.beginPath();
			ctx.arc(rx,ry,radius,0, 2*Math.PI,false);
			ctx.fill();
		}
	}

	for (i=0; i<=100; i++){
		var rx = Math.round(Math.random()*nwidth);
		var ry = Math.round(Math.random()*nheight);
		if (insideEllipse(rx,ry,50,50,x,y)){
			var radius = Math.round(Math.random()*50);
			var r=Math.round(Math.random()*rr)+lum;
			var g=Math.round(Math.random()*rg)+lum;
			var b=Math.round(Math.random()*rb)+lum;
			var a=Math.random()/10;
			ctx.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
			ctx.beginPath();
			ctx.arc(rx,ry,radius,0, 2*Math.PI,false);
			ctx.fill();
		}
	}
	for (i=0; i<=100; i++){
		var rx = Math.round(Math.random()*nwidth);
		var ry = Math.round(Math.random()*nheight);
		if (insideEllipse(rx,ry,50,50,x,y)){
			var radius = Math.round(Math.random()*50);
			var r=Math.round(Math.random()*rr)+lum;
			var g=Math.round(Math.random()*rg)+lum;
			var b=Math.round(Math.random()*rb)+lum;
			var a=Math.random()/10;
			ctx.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
			ctx.beginPath();
			ctx.arc(rx,ry,radius,0, 2*Math.PI,false);
			ctx.fill();
		}
	}
}

function noise(max,xrange,yrange,rrange,grange,brange,rplus,gplus,bplus,ctx){
	for (i=0; i<=max; i++){
		var rx = Math.round(Math.random()*xrange);
		var ry = Math.round(Math.random()*yrange);
		var radius = Math.round(Math.random()*2);
		var r=Math.round(Math.random()*rrange)+rplus;
		var g=Math.round(Math.random()*grange)+gplus;
		var b=Math.round(Math.random()*brange)+bplus;
		var a=1;
		ctx.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
		ctx.beginPath();
		ctx.arc(rx,ry,radius,0, 2*Math.PI,false);
		ctx.fill();
	}
}

function load() {
	var c=document.getElementById('stars');
	var ctx=c.getContext('2d');

	ctx.fillStyle = "rgba(0,0,0,255)";
	ctx.fillRect( 0, 0, 4096, 4096 );
	noise(150000,4096,4096,15,15,35,0,0,0,ctx);

	var nebulaCanvas=document.getElementById('nebula');
	var nebulaCtx = nebulaCanvas.getContext("2d");

	for (var j=0; j<50; j++){
		nebulaCtx.clearRect(0,0,1024,1024);
		var startX = startY = 512;
		var delta=1;
		var r=Math.round(Math.random()*155);
		var g=Math.round(Math.random()*155);
		var b=Math.round(Math.random()*155);
		for (var i=0; i<50; i++){
			nebula(r,g,b,startX,startY,100);
			delta=Math.round(Math.random()*150)-75;
			startX+=delta*((Math.random()*2)-1);
			startY+=delta*((Math.random()*2)-1);
			if(startX>950)startX-=500;
			if(startX<50)startX=500;
			if(startY>950)startY=500;
			if(startY<50)startY=500;
		}
		var x = Math.round(Math.random()*(bwidth-500))-250;
		var y = Math.round(Math.random()*(bheight-500))-250;
		ctx.drawImage(nebulaCanvas,x,y);
	}
	noise(10000,4096,4096,55,55,55,200,200,200,ctx);
}