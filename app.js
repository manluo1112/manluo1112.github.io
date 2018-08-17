$('#pos-btn').click(function() {
  var seq = $('#seq').val();
  var data = geoData[seq];
  if (data != undefined) {
    geoCoord = data;
    geoCoord = coordtransform.wgs84togcj02(geoCoord[0], geoCoord[1]); // 火星坐标转国测局坐标
    geoCoord = coordtransform.gcj02tobd09(geoCoord[0], geoCoord[1]);  // 国测局坐标转百度坐标
    bmap.panTo(new BMap.Point(geoCoord[0], geoCoord[1]));
  } else {
    console.log(seq + "不存在!");
  }
});

var myChart = echarts.init(document.getElementById('main'));
myChart.showLoading();

$.getJSON('geoCoordMap.json').done(function (geoCoordMap) {
  geoData = geoCoordMap;

  $.getJSON('nodes.json').done(function(nodes) {
    $.getJSON('edges.json').done(function(edges) {

      var convertNode = function(data) {
        var res = [];
        for (var key in data) {
          if (key in geoCoordMap) {
            var geoCoord = geoCoordMap[key];
            geoCoord = coordtransform.wgs84togcj02(geoCoord[0], geoCoord[1]); // 火星坐标转国测局坐标
            geoCoord = coordtransform.gcj02tobd09(geoCoord[0], geoCoord[1]);  // 国测局坐标转百度坐标
            var value = data[key];
            res.push({
              name: key,
              value: geoCoord.concat(value),
              symbolSize: 5 + Math.ceil(Math.log2(value))
            });
          }
        }
        return res;
      };

      var convertEdge = function(links) {
        var res = [];
        for (var source in links) {
          for (var target in links[source]) {
            value = links[source][target];
            if (nodes[target] < 1000 || value < 10)
              continue
            res.push({
              source: source,
              target: target,
              value: value,
              lineStyle: {
                normal: {
                  'width': Math.ceil(Math.log(value)),
                  'color': '#FFFFFF'
                }
              }
            });
          }
        }
        return res;
      };

      myChart.hideLoading();

      var colors = randomColor({
        count: Object.keys(nodes).length,
        luminosity: 'light'
      });

      var option = {
        title: {
          text: '上海市3月订单路径',
          left: 'center',
          textStyle: {
            color: '#fff'
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: function(params) {
            // console.log(params);
            if (params.value instanceof Array) {
              return params.name + ':' + params.value[2];
            } else {
              return params.name + ':' + params.value;
            }
          }
        },
        bmap: {
          center: [121.446332,31.183795],
          zoom: 11,
          roam: true,
          mapStyle: {
            style: 'dark'
          }
        },
        visualMap: {
          type: 'piecewise',
          min: 0,
          max: 500,
          maxOpen: true,
          splitNumber: 10,
          color: ['#d94e5d','#eac736','#50a3ba'],
          textStyle: {
              color: '#fff'
          }
        },
        series: [{
          type: 'graph',
          // 使用百度地图坐标系
          coordinateSystem: 'bmap',
          // 数据格式跟在 geo 坐标系上一样，每一项都是 [经度，纬度，数值大小，其它维度...]
          focusNodeAdjacency: true,
          nodes: convertNode(nodes),
          edges: convertEdge(edges),
          // edges: convertLink({
          //   '5774': {
          //     '5106': 10,
          //     '3993': 10
          //   },
          //   '6912': {
          //     '8286': 1000,
          //     '6913': 1000
          //   }
          // }),
          symbol: 'pin',
          label: {
            formatter: '{b}'
          },
          edgeSymbol: ['none', 'arrow'],
          lineStyle: {
            normal: {
              curveness: 0.2
            }
          }
        }]
      };
      myChart.setOption(option);

      bmap = myChart.getModel().getComponent('bmap').getBMap();
      bmap.addControl(new BMap.MapTypeControl());

      var disTool = new BMapLib.DistanceTool(bmap);
      var menu = new BMap.ContextMenu();
      menu.addItem(new BMap.MenuItem('测距', function() {
        disTool.open();
      }));
      bmap.addContextMenu(menu);

    });
  });
});
