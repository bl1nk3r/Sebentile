/*SELF EVALUATION BUTTON*/
//plugin bootstrap minus and plus
$('.btn-number').click(function(e){
    e.preventDefault();
    fieldName = $(this).attr('data-field');
    type      = $(this).attr('data-type');
    var input = $("input[name='"+fieldName+"']");
    var currentVal = parseInt(input.val());
    if (!isNaN(currentVal)) {
        if(type == 'minus') {
            if(currentVal > input.attr('min')) {
                input.val(currentVal - 1).change();
            } 
            if(parseInt(input.val()) == input.attr('min')) {
                $(this).attr('disabled', true);
            }

        } else if(type == 'plus') {

            if(currentVal < input.attr('max')) {
                input.val(currentVal + 1).change();
            }
            if(parseInt(input.val()) == input.attr('max')) {
                $(this).attr('disabled', true);
            }
        }
    } else {
        input.val(0);
    }
});
$('.input-number').focusin(function(){
   $(this).data('oldValue', $(this).val());
});
$('.input-number').change(function() {
    
    minValue =  parseInt($(this).attr('min'));
    maxValue =  parseInt($(this).attr('max'));
    valueCurrent = parseInt($(this).val());
    
    name = $(this).attr('name');
    if(valueCurrent >= minValue) {
        $(".btn-number[data-type='minus'][data-field='"+name+"']").removeAttr('disabled')
    } else {
        alert('Sorry, the minimum value was reached');
        $(this).val($(this).data('oldValue'));
    }
    if(valueCurrent <= maxValue) {
        $(".btn-number[data-type='plus'][data-field='"+name+"']").removeAttr('disabled')
    } else {
        alert('Sorry, the maximum value was reached');
        $(this).val($(this).data('oldValue'));
    }
    
    
});
$(".input-number").keydown(function (e) {
        // Allow: backspace, delete, tab, escape, enter and .
        if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 190]) !== -1 ||
             // Allow: Ctrl+A
            (e.keyCode == 65 && e.ctrlKey === true) || 
             // Allow: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
                 // let it happen, don't do anything
                 return;
        }
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });
/*END OF SElF SEVALUATION BUTTON*/
/*Dashboard*/
//Employee Mini dash solid gauge
$(document).ready(function() {  
   var chart = {      
      type: 'solidgauge'
   };
   var title = null;

   var pane = {
      center: ['50%', '85%'],
      size: '140%',
      startAngle: -90,
      endAngle: 90,
      background: {
         backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || '#EEE',
         innerRadius: '60%',
         outerRadius: '100%',
         shape: 'arc'
      }
   };

   var tooltip = {
      enabled: true
   };
      
   // the value axis
   var yAxis = {
      stops: [
         [0.1, '#DF5353'], // green
         [0.5, '#DDDF0D'], // yellow
         [0.9, '#55BF3B'] // red
      ],
      lineWidth: 0,
      minorTickInterval: null,
      tickPixelInterval: 400,
      tickWidth: 0,
      title: {
         y: -70
      },
      labels: {
         y: 16
      },
	  min: 0,
      max: 5,
      title: {
         text: 'Score'
      }
   };	  
   
   var plotOptions = {
      solidgauge: {
         dataLabels: {
            y: 5,
            borderWidth: 0,
            useHTML: true
         }
      }
   };
   
   var credits = {
      enabled: false
   };

   var series = [{
      name: 'Your Score',
      data: [4.3],
      dataLabels: {
         format: '<div style="text-align:center"><span style="font-size:25px;color:' +
         ((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y}</span><br/>' +
         '<span style="font-size:12px;color:silver">Rating</span></div>'
      },
      tooltip: {
         valueSuffix: 'Rating'
      }
   }];
	  
   var json = {};   
   json.chart = chart; 
   json.title = title;       
   json.pane = pane; 
   json.tooltip = tooltip; 
   json.yAxis = yAxis; 
   json.credits = credits; 
   json.series = series;     
   $('#container-speed').highcharts(json);   
   
   
   // the value axis
/*   yAxis = {
      stops: [
         [0.1, '#55BF3B'], // green
         [0.5, '#DDDF0D'], // yellow
         [0.9, '#DF5353'] // red
      ],
      lineWidth: 0,
      minorTickInterval: null,
      tickPixelInterval: 400,
      tickWidth: 0,
      title: {
         y: -70
      },
      labels: {
         y: 16
      },
	  min: 0,
      max: 5,
      title: {
         text: 'RPM'
      }
   };	*/  
   /*
   series = [{
      name: 'RPM',
      data: [1],
      dataLabels: {
         format: '<div style="text-align:center"><span style="font-size:25px;color:' +
         ((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y:.1f}</span><br/>' +
         '<span style="font-size:12px;color:silver">* 1000 / min</span></div>'
      },
      tooltip: {
         valueSuffix: ' revolutions/min'
      }
   }];*/
   
   json.yAxis = yAxis;   
   json.series = series;     
   $('#container-rpm').highcharts(json);  
   
   var chartFunction = function() {
      // Speed
      var chart = $('#container-speed').highcharts();
      var point;
      var newVal;
      var inc;
      /*
      if (chart) {
         point = chart.series[0].points[0];
         inc = Math.round((Math.random() - 0.5) * 100);
         newVal = point.y + inc;

         if (newVal < 0 || newVal > 5) {
            newVal = point.y - inc;
         }
         point.update(newVal);
      }*/

      // RPM
      chart = $('#container-rpm').highcharts();
      if (chart) {
         point = chart.series[0].points[0];
         inc = Math.random() - 0.5;
         newVal = point.y + inc;

         if (newVal < 0 || newVal > 5) {
            newVal = point.y - inc;
         }

         point.update(newVal);
      }
   };   
   // Bring life to the dials
   setInterval(chartFunction, 2000);
});

//Overral rating : Employee
$(document).ready(function() {
   var title = {
      text: 'Overall Employee Rating '   
   };
   var subtitle = {
      text: 'Source: Sebentile'
   };
   var xAxis = {
      categories: ['Mar-15:2013', 'Sep-14:2014', 'Mar-15:2016']
   };
   var yAxis = {
      title: {
         text: 'Overall Rating (%)'
      },
      plotLines: [{
         value: 0,
         width: 1,
         color: '#808080'
      }]
   };   

   var tooltip = {
      valueSuffix: '%'
   }

   var legend = {
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle',
      borderWidth: 0
   };

   var series =  [
      {
         name: 'Score',
         data: [2.6, 4.2, 3.2]
      }
   ];

   var json = {};

   json.title = title;
   json.subtitle = subtitle;
   json.xAxis = xAxis;
   json.yAxis = yAxis;
   json.tooltip = tooltip;
   json.legend = legend;
   json.series = series;

   $('#overral').highcharts(json);
});