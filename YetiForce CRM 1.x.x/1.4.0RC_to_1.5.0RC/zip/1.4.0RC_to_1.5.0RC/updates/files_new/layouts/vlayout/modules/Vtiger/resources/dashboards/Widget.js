/*+***********************************************************************************
 * The contents of this file are subject to the vtiger CRM Public License Version 1.0
 * ("License"); You may not use this file except in compliance with the License
 * The Original Code is:  vtiger CRM Open Source
 * The Initial Developer of the Original Code is vtiger.
 * Portions created by vtiger are Copyright (C) vtiger.
 * All Rights Reserved.
 * Contributor(s): YetiForce.com
 *************************************************************************************/
jQuery.Class('Vtiger_Widget_Js',{
	widgetPostLoadEvent : 'Vtiget.Dashboard.PostLoad',
	widgetPostRefereshEvent : 'Vtiger.Dashboard.PostRefresh',

	getInstance : function(container, widgetName, moduleName) {
		if(typeof moduleName == 'undefined') {
			moduleName = app.getModuleName();
		}
		var widgetClassName = widgetName.toCamelCase();
		var moduleClass = window[moduleName+"_"+widgetClassName+"_Widget_Js"];
		var fallbackClass = window["Vtiger_"+widgetClassName+"_Widget_Js"];
		var yetiClass = window["YetiForce_"+widgetClassName+"_Widget_Js"];
		var basicClass = Vtiger_Widget_Js;
		if(typeof moduleClass != 'undefined') {
			var instance = new moduleClass(container);
		}else if(typeof fallbackClass != 'undefined') {
			var instance = new fallbackClass(container);
		}else if(typeof yetiClass != 'undefined') {
			var instance = new yetiClass(container);
		} else {
			var instance = new basicClass(container);
		}
		return instance;
	}
},{

	container : false,
	plotContainer : false,
	plotInstance : false,
	chartData : [],

	init : function (container) {
		this.setContainer(jQuery(container));
		this.registerWidgetPostLoadEvent(container);
		this.registerWidgetPostRefreshEvent(container);
	},

	getContainer : function() {
		return this.container;
	},

	setContainer : function(element) {
		this.container = element;
		return this;
	},

	isEmptyData : function() {
		var container = this.getContainer();
		return (container.find('.noDataMsg').length > 0) ? true : false;
	},

	getUserDateFormat : function() {
		return jQuery('#userDateFormat').val();
	},


	getPlotContainer : function(useCache) {
		if(typeof useCache == 'undefined'){
			useCache = false;
		}
		if(this.plotContainer == false || !useCache) {
			var container = this.getContainer();
			this.plotContainer = container.find('.widgetChartContainer');
		}
		return this.plotContainer;
	},

	restrictContentDrag : function(){
		this.getContainer().on('mousedown.draggable', function(e){
			var element = jQuery(e.target);
			var isHeaderElement = element.closest('.dashboardWidgetHeader').length > 0 ? true : false;
			if(isHeaderElement){
				return;
			}
			//Stop the event propagation so that drag will not start for contents
			e.stopPropagation();
		})
	},

	convertToDateRangePicketFormat : function(userDateFormat) {
		switch( userDateFormat ) {
			case 'yyyy-mm-dd':	return 'yyyy-MM-dd';	break;
			case 'mm-dd-yyyy':	return 'MM-dd-yyyy';	break;
			case 'dd-mm-yyyy':	return 'dd-MM-yyyy';	break;
			case 'yyyy.mm.dd':	return 'yyyy.MM.dd';	break;
			case 'mm.dd.yyyy':	return 'MM.dd.yyyy';	break;
			case 'dd.mm.yyyy':	return 'dd.MM.yyyy';	break;
			case 'yyyy/mm/dd':	return 'yyyy/MM/dd';	break;
			case 'mm/dd/yyyy':	return 'MM/dd/yyyy';	break;
			case 'dd/mm/yyyy':	return 'dd/MM/yyyy';	break;
		}
	},

	generateData : function() {
		var thisInstance = this;
		var container = thisInstance.getContainer();
		var jData = container.find('.widgetData').val();
		var data = JSON.parse(jData);
		var chartData = [];
		for(var index in data) {
			chartData.push(data[index]);
			thisInstance.chartData[data[index].id] = data[index];
		}
		return {'chartData':chartData};
	},
	
	loadChart : function() {

	},

	positionNoDataMsg : function() {
		var container = this.getContainer();
		var widgetContentsContainer = container.find('.dashboardWidgetContent');
		var noDataMsgHolder = widgetContentsContainer.find('.noDataMsg');
		noDataMsgHolder.position({
				'my' : 'center center',
				'at' : 'center center',
				'of' : widgetContentsContainer
		})
	},


	//Place holdet can be extended by child classes and can use this to handle the post load
	postLoadWidget : function() {
		if(!this.isEmptyData()) {
			this.loadChart();
		}else{
			this.positionNoDataMsg();
		}
		this.registerSectionClick();
		this.registerFilter();
		this.registerFilterChangeEvent();
		this.restrictContentDrag();
	},

	postRefreshWidget : function() {
		if(!this.isEmptyData()) {
			this.loadChart();
		}else{
			this.positionNoDataMsg();
		}
		this.registerSectionClick();
	},

	getFilterData : function() {
		return {};
	},

	refreshWidget : function() {
		var parent = this.getContainer();
		var element = parent.find('a[name="drefresh"]');
		var url = element.data('url');

		var contentContainer = parent.find('.dashboardWidgetContent');
		var params = url;
		var widgetFilters = parent.find('.widgetFilter');
		if(widgetFilters.length > 0) {
			params = {};
			params.url = url;
			params.data = {}
			widgetFilters.each(function(index, domElement){
				var widgetFilter = jQuery(domElement);
				if(widgetFilter.is('.dateRange')){
					var dateRangeVal = widgetFilter.val();
					//If not value exists for date field then dont send the value
					if(dateRangeVal.length <= 0) {
						return true;
					}
					var name = widgetFilter.attr('name');
					var dateRangeValComponents = dateRangeVal.split(',');
					params.data[name] = {};
					params.data[name].start = dateRangeValComponents[0];
					params.data[name].end = dateRangeValComponents[1];
				}else{
					var filterType = widgetFilter.attr('type');
					var filterName = widgetFilter.attr('name');
					if('checkbox' == filterType){
						var filterValue = widgetFilter.is(':checked');
						params.data[filterName] = filterValue;
					}else{
						var filterValue = widgetFilter.val();
						params.data[filterName] = filterValue;
					}
				}
			});
		}
		var filterData = this.getFilterData();
		if(! jQuery.isEmptyObject(filterData)) {
			if(typeof params == 'string') {
				url = params;
				params = {};
				params.url = url
				params.data = {};
			}
			params.data = jQuery.extend(params.data, this.getFilterData())
		}
		var refreshContainer = parent.find('.refresh');
		refreshContainer.progressIndicator({
			'smallLoadingImage' : true
		});
		AppConnector.request(params).then(
			function(data){
				refreshContainer.progressIndicator({'mode': 'hide'});
				contentContainer.html(data).trigger(Vtiger_Widget_Js.widgetPostRefereshEvent);
			},
			function(){
				refreshContainer.progressIndicator({'mode': 'hide'});
			}
		);
	},

	registerFilter : function() {
		var thisInstance = this;
		var container = this.getContainer();
		var dateRangeElement = container.find('input.dateRange');
		var dateChanged = false;
		if(dateRangeElement.length <= 0) {
			return;
		}
		var customParams = {
			calendars: 3,
			mode: 'range',
			className : 'rangeCalendar',
			onChange: function(formated) {
				dateChanged = true;
				var element = jQuery(this).data('datepicker').el;
				jQuery(element).val(formated);
			},
			onHide : function() {
				if(dateChanged){
					container.find('a[name="drefresh"]').trigger('click');
					dateChanged = false;
				}
			},
			onBeforeShow : function(elem) {
				jQuery(elem).css('z-index','3');
			}
		}
		dateRangeElement.addClass('dateField').attr('data-date-format',thisInstance.getUserDateFormat());
		app.registerEventForDatePickerFields(dateRangeElement,false,customParams);
	},

	registerFilterChangeEvent : function() {
		this.getContainer().on('change', '.widgetFilter', function(e) {
			var widgetContainer = jQuery(e.currentTarget).closest('li');
			widgetContainer.find('a[name="drefresh"]').trigger('click');
		})
	},

	registerWidgetPostLoadEvent : function(container) {
		var thisInstance = this;
		container.on(Vtiger_Widget_Js.widgetPostLoadEvent, function(e) {
			thisInstance.postLoadWidget();
		})
	},

	registerWidgetPostRefreshEvent : function(container) {
		var thisInstance = this;
		container.on(Vtiger_Widget_Js.widgetPostRefereshEvent, function(e) {
			thisInstance.postRefreshWidget();
		});
	},

	registerSectionClick : function() {}
});

Vtiger_Widget_Js('Vtiger_History_Widget_Js', {}, {

	postLoadWidget: function() {
		this._super();

		var widgetContent = jQuery('.dashboardWidgetContent', this.getContainer());
		widgetContent.css({height: widgetContent.height()-40});
		this.registerLoadMore();
	},

	postRefreshWidget: function() {
		this._super();
		this.registerLoadMore();
	},

	registerLoadMore: function() {
		var thisInstance  = this;
		var parent = thisInstance.getContainer();
		var contentContainer = parent.find('.dashboardWidgetContent');

		var loadMoreHandler = contentContainer.find('.load-more');
		loadMoreHandler.click(function(){
			var parent = thisInstance.getContainer();
			var element = parent.find('a[name="drefresh"]');
			var url = element.data('url');
			var params = url;

			var widgetFilters = parent.find('.widgetFilter');
			if(widgetFilters.length > 0) {
				params = { url: url, data: {}};
				widgetFilters.each(function(index, domElement){
					var widgetFilter = jQuery(domElement);
					var filterName = widgetFilter.attr('name');
					var filterValue = widgetFilter.val();
					params.data[filterName] = filterValue;
				});
			}

			var filterData = thisInstance.getFilterData();
			if(! jQuery.isEmptyObject(filterData)) {
				if(typeof params == 'string') {
					params = { url: url, data: {}};
				}
				params.data = jQuery.extend(params.data, thisInstance.getFilterData())
			}

			// Next page.
			params.data['page'] = loadMoreHandler.data('nextpage');

			var refreshContainer = parent.find('.refresh');
			refreshContainer.progressIndicator({
				'smallLoadingImage' : true
			});
			AppConnector.request(params).then(function(data){
				refreshContainer.progressIndicator({'mode': 'hide'});
				loadMoreHandler.replaceWith(data);
				thisInstance.registerLoadMore();
			}, function(){
				refreshContainer.progressIndicator({'mode': 'hide'});
			});
		});
	}

});


Vtiger_Widget_Js('Vtiger_Funnel_Widget_Js',{},{

        postLoadWidget: function() {
                        this._super();
                var thisInstance = this;

                        this.getContainer().on('jqplotDataClick', function(ev, gridpos, datapos, neighbor, plot) {
                    var jData = thisInstance.getContainer().find('.widgetData').val();
                                var data = JSON.parse(jData);
                                var linkUrl = data[datapos][3];
                                if(linkUrl) window.location.href = linkUrl;
                        });

                        this.getContainer().on("jqplotDataHighlight", function(evt, seriesIndex, pointIndex, neighbor) {
                                $('.jqplot-event-canvas').css( 'cursor', 'pointer' );
                        });
                        this.getContainer().on("jqplotDataUnhighlight", function(evt, seriesIndex, pointIndex, neighbor) {
                                $('.jqplot-event-canvas').css( 'cursor', 'auto' );
                        });
            },

	loadChart : function() {
		var container = this.getContainer();
		var data = container.find('.widgetData').val();
		var labels = new Array();
		var dataInfo = JSON.parse(data);
		for(var i=0; i<dataInfo.length; i++) {
			labels[i] = dataInfo[i][2];
			dataInfo[i][1] = parseFloat(dataInfo[i][1]);
		}
		this.getPlotContainer(false).jqplot([dataInfo],  {
			seriesDefaults: {
				renderer:jQuery.jqplot.FunnelRenderer,
				rendererOptions:{
					sectionMargin: 12,
					widthRatio: 0.1,
					showDataLabels:true,
					dataLabelThreshold: 0,
					dataLabels: 'value'
				}
			},
			legend: {
				show: true,
				location: 'ne',
				placement: 'outside',
				labels:labels,
				xoffset:20
			}
		});
	},


	registerSectionClick : function() {
		this.getContainer().on('jqplotDataClick', function() {
			var sectionData = arguments[3];
			var salesStageValue = sectionData[0];
			//TODO : we need to construct the list url with the sales stage and filters
		})

	}
});



Vtiger_Widget_Js('Vtiger_Pie_Widget_Js',{},{

	/**
	 * Function which will give chart related Data
	 */
	generateData : function() {
		var container = this.getContainer();
		var jData = container.find('.widgetData').val();
		var data = JSON.parse(jData);
		var chartData = [];
		for(var index in data) {
			var row = data[index];
			var rowData = [row.last_name, parseFloat(row.sum_invoices), row.id];
			chartData.push(rowData);
		}
		return {'chartData':chartData};
	},

	loadChart : function() {
		var chartData = this.generateData();

		this.getPlotContainer(false).jqplot([chartData['chartData']], {
			seriesDefaults:{
				renderer:jQuery.jqplot.PieRenderer,
				rendererOptions: {
					showDataLabels: true,
					dataLabels: 'value'
				}
			},
			legend: {
				show: true,
				location: 'e'
			},
			title : chartData['title']
		});
	},

	registerSectionClick : function() {
		this.getPlotContainer().on('jqplotDataClick', function() {
			var sectionData = arguments[3];
			var assignedUserId = sectionData[2];
			//TODO : we need to construct the list url with the sales stage and filters
		})

	}
});


Vtiger_Widget_Js('Vtiger_Barchat_Widget_Js',{},{
	generateChartData : function() {
		var container = this.getContainer();
		var jData = container.find('.widgetData').val();
		var data = JSON.parse(jData);
		var chartData = [];
		var xLabels = new Array();
		var yMaxValue = 0;
		for(var index in data) {
			var row = data[index];
			row[0] = parseInt(row[0]);
			xLabels.push(app.getDecodedValue(row[1]))
			chartData.push(row[0]);
			if(parseInt(row[0]) > yMaxValue){
				yMaxValue = parseInt(row[0]);
			}
		}
		// yMaxValue Should be 25% more than Maximum Value
		yMaxValue = yMaxValue + 2 + (yMaxValue/100)*25;
		return {'chartData':[chartData], 'yMaxValue':yMaxValue, 'labels':xLabels};
	},

	loadChart : function() {
		var data = this.generateChartData();
		this.getPlotContainer(false).jqplot(data['chartData'] , {
			title: data['title'],
			animate: !$.jqplot.use_excanvas,
			seriesDefaults:{
				renderer:jQuery.jqplot.BarRenderer,
				rendererOptions: {
					showDataLabels: true,
					dataLabels: 'value',
					barDirection : 'vertical'
				},
				pointLabels: {show: true,edgeTolerance: -15}
			},
			axes: {
				xaxis: {
					tickRenderer: jQuery.jqplot.CanvasAxisTickRenderer,
					renderer: jQuery.jqplot.CategoryAxisRenderer,
					ticks: data['labels'],
					tickOptions: {
						angle: -45
					}
				},
				yaxis: {
					min:0,
					max: data['yMaxValue'],
					tickOptions: {
						formatString: '%d'
					},
					pad : 1.2
				}
			},
			legend: {
				show		: (data['data_labels']) ? true:false,
				location	: 'e',
				placement	: 'outside',
				showLabels	: (data['data_labels']) ? true:false,
				showSwatch	: (data['data_labels']) ? true:false,
				labels		: data['data_labels']
			}
		});
//		this.getPlotContainer(false).on('jqPlotDataClick', function(){
//			console.log('here');
//		});
//		jQuery.jqplot.eventListenerHooks.push(['jqPlotDataClick', myClickHandler]);
	}

//	registerSectionClick : function() {
//		this.getPlotContainer(false);
//	}
});

Vtiger_Widget_Js('Vtiger_MultiBarchat_Widget_Js',{

	/**
	 * Function which will give char related Data like data , x labels and legend labels as map
	 */
	getCharRelatedData : function() {
		var container = this.getContainer();
		var data = container.find('.widgetData').val();
		var users = new Array();
		var stages = new Array();
		var count = new Array();
		for(var i=0; i<data.length;i++) {
			if($.inArray(data[i].last_name, users) == -1) {
				users.push(data[i].last_name);
			}
			if($.inArray(data[i].sales_stage, stages) == -1) {
				stages.push(data[i].sales_stage);
			}
		}

		for(j in stages) {
			var salesStageCount = new Array();
			for(i in users) {
				var salesCount = 0;
				for(var k in data) {
					var userData = data[k];
					if(userData.sales_stage == stages[j] && userData.last_name == users[i]) {
						salesCount = parseInt(userData.count);
						break;
					}
				}
				salesStageCount.push(salesCount);
			}
			count.push(salesStageCount);
		}
		return {
			'data' : count,
			'ticks' : users,
			'labels' : stages
		}
	},
    
	loadChart : function(){
		var chartRelatedData = this.getCharRelatedData();
		var chartData = chartRelatedData.data;
		var ticks = chartRelatedData.ticks;
		var labels = chartRelatedData.labels;
		$.jqplot.CanvasAxisTickRenderer.pt2px=2.4;
		this.getPlotContainer(false).jqplot( chartData, {
			stackSeries: true,
			captureRightClick: true,
			seriesDefaults:{
				renderer:$.jqplot.BarRenderer,
				rendererOptions: {
					// Put a 30 pixel margin between bars.
					barMargin: 10,
					// Highlight bars when mouse button pressed.
					// Disables default highlighting on mouse over.
					highlightMouseDown: true,
                    highlightMouseOver : true
			},
				pointLabels: {show: true,hideZeros: true}
			},
			axes: {
				xaxis: {
					renderer: $.jqplot.CategoryAxisRenderer,
					tickRenderer: $.jqplot.CanvasAxisTickRenderer,					
					tickOptions: {						
						angle: -45,
						pt2px: 4.0
					},
					ticks: ticks
				},
				yaxis: {
					// Don't pad out the bottom of the data range.  By default,
					// axes scaled as if data extended 10% above and below the
					// actual range to prevent data points right on grid boundaries.
					// Don't want to do that here.
					padMin: 0,
					min:0
				}
			},
			legend: {
				show: true,
				location: 'e',
				placement: 'outside',
				labels:labels
			}
	  });
	}
});

// NOTE Widget-class name camel-case convention
Vtiger_Widget_Js('Vtiger_Minilist_Widget_Js', {}, {

	postLoadWidget: function() {
		app.hideModalWindow();
		this.restrictContentDrag();
		this.registerFilterChangeEvent();
	}
});

Vtiger_Widget_Js('Vtiger_Tagcloud_Widget_Js',{},{

	postLoadWidget : function() {
		this._super();
		this.registerTagCloud();
		this.registerTagClickEvent();
	},

	registerTagCloud : function() {
		jQuery('#tagCloud').find('a').tagcloud({
			size: {
			  start: parseInt('12'),
			  end: parseInt('30'),
			  unit: 'px'
			},
			color: {
			  start: "#0266c9",
			  end: "#759dc4"
			}
		});
	},

	registerChangeEventForModulesList : function() {
		jQuery('#tagSearchModulesList').on('change',function(e) {
			var modulesSelectElement = jQuery(e.currentTarget);
			if(modulesSelectElement.val() == 'all'){
				jQuery('[name="tagSearchModuleResults"]').removeClass('hide');
			} else{
				jQuery('[name="tagSearchModuleResults"]').removeClass('hide');
				var selectedOptionValue = modulesSelectElement.val();
				jQuery('[name="tagSearchModuleResults"]').filter(':not(#'+selectedOptionValue+')').addClass('hide');
			}
		});
	},

	registerTagClickEvent : function(){
		var thisInstance = this;
		var container = this.getContainer();
		container.on('click','.tagName',function(e) {
			var tagElement = jQuery(e.currentTarget);
			var tagId = tagElement.data('tagid');
			var params = {
				'module' : app.getModuleName(),
				'view' : 'TagCloudSearchAjax',
				'tag_id' : tagId,
				'tag_name' : tagElement.text()
			}
			AppConnector.request(params).then(
				function(data) {
					var params = {
						'data' : data,
						'css'  : {'min-width' : '40%'}
					}
					app.showModalWindow(params);
					thisInstance.registerChangeEventForModulesList();
				}
			)
		});
	},

	postRefreshWidget : function() {
		this._super();
		this.registerTagCloud();
	}
});

/* Notebook Widget */
Vtiger_Widget_Js('Vtiger_Notebook_Widget_Js', {

}, {

	// Override widget specific functions.
	postLoadWidget: function() {
		this.reinitNotebookView();
	},

	reinitNotebookView: function() {
		var self = this;
		app.showScrollBar(jQuery('.dashboard_notebookWidget_viewarea', this.container), {'height':'200px'});
		jQuery('.dashboard_notebookWidget_edit', this.container).click(function(){
			self.editNotebookContent();
		});
		jQuery('.dashboard_notebookWidget_save', this.container).click(function(){
			self.saveNotebookContent();
		});
	},

	editNotebookContent: function() {
		jQuery('.dashboard_notebookWidget_text', this.container).show();
		jQuery('.dashboard_notebookWidget_view', this.container).hide();
	},

	saveNotebookContent: function() {
		var self = this;
		var refreshContainer = this.container.find('.refresh');
		var textarea = jQuery('.dashboard_notebookWidget_textarea', this.container);

		var url = this.container.data('url');
		var params = url + '&content=true&mode=save&contents=' + encodeURIComponent(textarea.val());

		refreshContainer.progressIndicator({
			'smallLoadingImage' : true
		});
		AppConnector.request(params).then(function(data) {
			refreshContainer.progressIndicator({'mode': 'hide'});
			jQuery('.dashboardWidgetContent', self.container).html(data);
			self.reinitNotebookView();
		});
	}
});

Vtiger_Widget_Js('Vtiger_KpiBarchat_Widget_Js',{},{
	generateChartData : function() {
		var container = this.getContainer();
		var jData = container.find('.widgetData').val();
		var data = JSON.parse(jData);
		var chartData = [];
		var xLabels = new Array();
		var yMaxValue = 0;
		return {'chartData':[[[data['result'],data['all']]]], 'yMaxValue':data['maxValue'], 'labels':''};
	},
	loadChart : function() {
		var data = this.generateChartData();
		this.getPlotContainer(false).jqplot(data['chartData'] , {
			animate: !$.jqplot.use_excanvas,
			seriesDefaults:{
				renderer:jQuery.jqplot.BarRenderer,
				rendererOptions: {
					showDataLabels: true,
					dataLabels: 'value',
					barDirection : 'horizontal'
				},
			},
			axes: {
				xaxis: {
					min: 0,
					max: data['yMaxValue'],
				},
				yaxis: {
					renderer: jQuery.jqplot.CategoryAxisRenderer,
				}
			}
		});
	}
});

Vtiger_Widget_Js('YetiForce_Pie_Widget_Js',{},{
	loadChart : function() {
		var thisInstance = this;
		var chartData = thisInstance.generateData();
		thisInstance.plotInstance = $.plot(thisInstance.getPlotContainer(false), chartData['chartData'], {
			series: {
				pie: { 
					show: true,
					label: { 
						formatter: thisInstance.getLabelFormat
					}
				}
			},
			legend: {
				show: false
			},
			grid: {
				hoverable: true,
				clickable: true
			},
		});
	},
	getLabelFormat : function(label, slice) {
		return "<div style='font-size:x-small;text-align:center;padding:2px;color:" + slice.color + ";'>" + label + "<br/>" + slice.data[0][1] + "</div>";	
	},
	registerSectionClick : function() {	
		var thisInstance = this;
		thisInstance.getPlotContainer().bind("plothover", function (event, pos, item) {
			if (item) {
				$(this).css( 'cursor', 'pointer' );
			}else{
				$(this).css( 'cursor', 'auto' );
			}
		});
		thisInstance.getPlotContainer().bind("plotclick", function (event, pos, item) {
			if (item) {
				if(item.series.links) window.location.href = item.series.links;
			}
		});
	}
});

Vtiger_Widget_Js('YetiForce_Bar_Widget_Js',{},{
	generateData : function() {
		var thisInstance = this;
		var container = thisInstance.getContainer();
		var jData = container.find('.widgetData').val();
		var data = JSON.parse(jData);	
		var chartData = [];
		for(var index in data['chart']) {
			chartData.push(data['chart'][index]);
			thisInstance.chartData[data['chart'][index].id] = data['chart'][index];
		}

		return {'chartData':chartData, 'ticks': data['ticks'], 'links' : data['links'], 'legend': data['legend']};
	},
	loadChart : function() {
		var thisInstance = this;
		var chartData = thisInstance.generateData();
		var options = {
			xaxis: {
				minTickSize: 1,
				ticks: chartData['ticks']
			},
			yaxis: { 
				min: 0 ,
				 tickDecimals: 0
			},
			grid: {
				hoverable: true,
				clickable: true
			},
			series: {
				bars: {
					show: true,
					barWidth: .9,
					dataLabels: false,
					align: "center",
					lineWidth: 0
				},
				stack: true
			}
		};
		thisInstance.plotInstance = $.plot(thisInstance.getPlotContainer(false), chartData['chartData'], options);
	},
	getLabelFormat : function(label, slice) {
		return "<div style='font-size:x-small;text-align:center;padding:2px;color:" + slice.color + ";'>" + label + "<br/>" + slice.data[0][1] + "</div>";	
	},
	registerSectionClick : function() {	
		var thisInstance = this;
		var chartData = thisInstance.generateData();
		thisInstance.getPlotContainer().bind("plothover", function (event, pos, item) {
			if (item) {
				$(this).css( 'cursor', 'pointer' );
			}else{
				$(this).css( 'cursor', 'auto' );
			}
		});
		thisInstance.getPlotContainer().bind("plotclick", function (event, pos, item) {			
			if(item) {
				$(chartData['links']).each(function(){
					if(item.dataIndex == this[0])
						window.location.href = this[1];
				});
			}
		});
	}
});
Vtiger_Widget_Js('YetiForce_Calendar_Widget_Js',{},{
	calendarView : false,
	calendarCreateView : false,
	weekDaysArray: {
	Sunday: 0, 
	Monday: 1, 
	Tuesday: 2, 
	Wednesday: 3, 
	Thursday: 4, 
	Friday: 5, 
	Saturday: 6
	},
	registerCalendar: function () {
		var thisInstance = this;
			userDefaultActivityView = 'month';

		//Default time format
		var userDefaultTimeFormat = jQuery('#time_format').val();
		if (userDefaultTimeFormat == 24) {
			userDefaultTimeFormat = 'H(:mm)';
		} else {
			userDefaultTimeFormat = 'h(:mm)tt';
		}

		//Default first day of the week
		var defaultFirstDay = jQuery('#start_day').val();
		var convertedFirstDay = thisInstance.weekDaysArray[defaultFirstDay];

		//Default first hour of the day
		var defaultFirstHour = jQuery('#start_hour').val();
		var explodedTime = defaultFirstHour.split(':');
		defaultFirstHour = explodedTime['0'];

		thisInstance.getCalendarView().fullCalendar({
			header: {
				left: ' ',
				center: 'prev title next',
				right: ' '
			},

			timeFormat: userDefaultTimeFormat,
			axisFormat: userDefaultTimeFormat,
			firstHour: defaultFirstHour,
			firstDay: convertedFirstDay,
			defaultView: userDefaultActivityView,
			editable: false,
			slotMinutes: 15,
			theme: false,
			defaultEventMinutes: 0,
			eventLimit: true,
			allDaySlot: false,
			monthNames: [app.vtranslate('JS_JANUARY'), app.vtranslate('JS_FEBRUARY'), app.vtranslate('JS_MARCH'),
				app.vtranslate('JS_APRIL'), app.vtranslate('JS_MAY'), app.vtranslate('JS_JUNE'), app.vtranslate('JS_JULY'),
				app.vtranslate('JS_AUGUST'), app.vtranslate('JS_SEPTEMBER'), app.vtranslate('JS_OCTOBER'),
				app.vtranslate('JS_NOVEMBER'), app.vtranslate('JS_DECEMBER')],
			monthNamesShort: [app.vtranslate('JS_JAN'), app.vtranslate('JS_FEB'), app.vtranslate('JS_MAR'),
				app.vtranslate('JS_APR'), app.vtranslate('JS_MAY'), app.vtranslate('JS_JUN'), app.vtranslate('JS_JUL'),
				app.vtranslate('JS_AUG'), app.vtranslate('JS_SEP'), app.vtranslate('JS_OCT'), app.vtranslate('JS_NOV'),
				app.vtranslate('JS_DEC')],
			dayNames: [app.vtranslate('JS_SUNDAY'), app.vtranslate('JS_MONDAY'), app.vtranslate('JS_TUESDAY'),
				app.vtranslate('JS_WEDNESDAY'), app.vtranslate('JS_THURSDAY'), app.vtranslate('JS_FRIDAY'),
				app.vtranslate('JS_SATURDAY')],
			dayNamesShort: [app.vtranslate('JS_SUN'), app.vtranslate('JS_MON'), app.vtranslate('JS_TUE'),
				app.vtranslate('JS_WED'), app.vtranslate('JS_THU'), app.vtranslate('JS_FRI'),
				app.vtranslate('JS_SAT')],
			buttonText: {
				today: app.vtranslate('JS_TODAY'),
				month: app.vtranslate('JS_MONTH'),
				week: app.vtranslate('JS_WEEK'),
				day: app.vtranslate('JS_DAY')
			},
			allDayText: app.vtranslate('JS_ALL_DAY'),
			eventLimitText: app.vtranslate('JS_MORE')
		});
	},
	loadCalendarData: function (allEvents) {
		var thisInstance = this;
		thisInstance.getCalendarView().fullCalendar('removeEvents');
		var view = thisInstance.getCalendarView().fullCalendar('getView');
		var start_date = view.start.format();
		var end_date = view.end.format();
		
		var parent = this.getContainer();
		var user = parent.find('#owner').val();
		if(user == 'all'){
			user = '';
		}
		var params = {
			module: 'Calendar',
			action: 'Calendar',
			mode: 'getEvents',
			start: start_date,
			end: end_date,
			user: user,
			widget: true
		}
		AppConnector.request(params).then(function (events) {
			var height = (thisInstance.getCalendarView().find('.fc-bg :first').height() - thisInstance.getCalendarView().find('.fc-day-number').height())-10;
			var width = (thisInstance.getCalendarView().find('.fc-day-number').width()/2)-10;
			for(var i in events.result){
				events.result[i]['width'] = width;
				events.result[i]['height'] = height;
			}
			thisInstance.getCalendarView().fullCalendar('addEventSource', 
			events.result
			);
		});

	},
	getCalendarView: function () {
		if (this.calendarView == false) {
			this.calendarView = jQuery('#calendarview');
		}
		return this.calendarView;
	},
	getMonthName: function () {
		var thisInstance = this;
		var month = thisInstance.getCalendarView().find('.fc-toolbar h2').text();
		if(month){
			headerCalendar = container.find('.headerCalendar .month').html('<h3>'+month+'</h3>');
		}
	},
	registerChangeView: function () {
		var thisInstance = this;
		container = this.getContainer();
		container.find('.fc-toolbar').addClass('hide');
		var month = container.find('.fc-toolbar h2').text();
		if(month){
			headerCalendar = container.find('.headerCalendar').removeClass('hide').find('.month').append('<h3>'+month+'</h3>');
			button = container.find('.headerCalendar button');
			button.each(function(){
				var tag = jQuery(this).data('type');
				jQuery(this).on('click',function(){
					thisInstance.getCalendarView().find('.fc-toolbar .'+tag).trigger('click');
					thisInstance.loadCalendarData();
					thisInstance.getMonthName();
				})
			})
		}
	},

	postLoadWidget : function() {
		this.registerCalendar();
		this.loadCalendarData(true);
		this.registerChangeView();
		this.registerFilterChangeEvent();

	},
	refreshWidget : function() {
		var thisInstance = this;
		var refreshContainer = this.getContainer().find('.refresh');
		refreshContainer.progressIndicator({
			'smallLoadingImage' : true
		});
	thisInstance.loadCalendarData();
	refreshContainer.progressIndicator({
	'mode': 'hide'});
	},
});