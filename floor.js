function buildFloor() {
	var c=document.getElementById('c128');
	var ctx=c.getContext('2d');
	ctx.fillStyle = "rgba(157,157,157,1)";
	ctx.fillRect( 0, 0, 128, 128 );
	noise(50000,128,128,25,25,25,150,150,150,ctx);
	for (i=0; i<128; i+=64){
		ctx.strokeStyle = "rgba(90,90,90,1)";
		ctx.beginPath();
		ctx.moveTo(0,i);
		ctx.lineTo(i,0);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(128,i);
		ctx.lineTo(i, 128);
		ctx.stroke();
		ctx.strokeStyle = "rgba(200,200,200,1)";
		ctx.beginPath();
		ctx.moveTo(i,0);
		ctx.lineTo(128,128-i);
		ctx.stroke();
		ctx.strokeStyle = "rgba(50,50,50,1)";
		ctx.beginPath();
		ctx.moveTo(i+2,0);
		ctx.lineTo(128,128-(i+2));
		ctx.stroke();
		ctx.strokeStyle = "rgba(200,200,200,1)";
		ctx.beginPath();
		ctx.moveTo(i,128);
		ctx.lineTo(0,128-i);
		ctx.stroke();
		ctx.strokeStyle = "rgba(50,50,50,1)";
		ctx.beginPath();
		ctx.moveTo(i+2,128);
		ctx.lineTo(0,128-(i+2));
		ctx.stroke();
	}
}