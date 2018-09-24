import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ElementRef, ViewEncapsulation, ChangeDetectorRef, Renderer, ViewChild, forwardRef } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { IMyDate, IMyDateRange, IMyMonth, IMyCalendarDay, IMyCalendarMonth, IMyCalendarYear, IMyWeek, IMyDayLabels, IMyMonthLabels, IMyOptions, IMyDateModel, IMyInputFieldChanged, IMyCalendarViewChanged, IMyInputFocusBlur, IMyMarkedDates, IMyMarkedDate } from "./interfaces/index";
import { LocaleService } from "./services/my-date-picker.locale.service";
import { UtilService } from "./services/my-date-picker.util.service";

/*
declare var require: any;
const myDpStyles: string = require("./my-date-picker.component.css");
const myDpTpl: string = require("./my-date-picker.component.html");
*/

export const MYDP_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MyDatePicker),
    multi: true
};

enum CalToggle {Open = 1, CloseByDateSel = 2, CloseByCalBtn = 3, CloseByOutClick = 4, CloseByEsc = 5, CloseByApi = 6}
enum Year {min = 1000, max = 9999}
enum InputFocusBlur {focus = 1, blur = 2}
enum KeyCode {enter = 13, esc = 27, space = 32}
enum MonthId {prev = 1, curr = 2, next = 3}

const MM = "mm";
const MMM = "mmm";
const DD = "dd";
const YYYY = "yyyy";

@Component({
    selector: "my-date-picker",
    exportAs: "mydatepicker",
    styles: [`.mydp .monthcell,.mydp .selection,.mydp .weekdaytitle{overflow:hidden;white-space:nowrap}.mydp{line-height:1;display:inline-block;position:relative}.mydp *{-moz-box-sizing:border-box;-webkit-box-sizing:border-box;box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;padding:0;margin:0}.mydp,.mydp .headertodaybtn,.mydp .selection,.mydp .selectiongroup,.mydp .selector{border-radius:4px}.mydp .header,.mydp .titlearea,.mydp .titleareatxt{border-radius:4px 4px 0 0}.mydp .caltable,.mydp .monthtable,.mydp .yeartable{border-radius:0 0 4px 4px}.mydp .caltable tbody tr:nth-child(6) td:first-child,.mydp .monthtable tbody tr:nth-child(4) td:first-child,.mydp .yeartable tbody tr:nth-child(7) td:first-child{border-bottom-left-radius:4px}.mydp .caltable tbody tr:nth-child(6) td:last-child,.mydp .monthtable tbody tr:nth-child(4) td:last-child,.mydp .yeartable tbody tr:nth-child(7) td:last-child{border-bottom-right-radius:4px}.mydp .btnpicker{border-radius:0 4px 4px 0}.mydp .selector{margin-top:2px;margin-left:-1px;position:absolute;z-index:100;animation:selectorfadein 60ms}@keyframes selectorfadein{from{opacity:0}to{opacity:1}}.mydp .selectorarrow:after,.mydp .selectorarrow:before{bottom:100%;border:solid transparent;content:" ";height:0;width:0;position:absolute}.mydp .selectorarrow:after{border-color:rgba(250,250,250,0);border-bottom-color:#FFF;border-width:10px;margin-left:-10px}.mydp .selectorarrow:before{border-color:rgba(204,204,204,0);border-bottom-color:#CCC;border-width:11px;margin-left:-11px}.mydp .selectorarrowleft:after,.mydp .selectorarrowleft:before{left:24px}.mydp .selectorarrowright:after,.mydp .selectorarrowright:before{left:224px}.mydp .alignselectorright{right:-1px}.mydp .selectiongroup{position:relative;display:table;border:none;border-spacing:0;background-color:#FFF}.mydp .selection{outline:0;background-color:#FFF;display:table-cell;position:absolute;top:50%;transform:translateY(-50%);width:100%;padding:0 64px 0 6px;text-overflow:ellipsis;border:none;color:#555}.mydp .invaliddaterange{background-color:#F1DEDE}.mydp ::-ms-clear{display:none}.mydp .headerbtncell,.mydp .selbtngroup{display:table-cell;vertical-align:middle}.mydp .selbtngroup{position:relative;white-space:nowrap;width:1%;font-size:0}.mydp .btnclear,.mydp .btnpicker{height:100%;width:26px;border:none;padding:0;outline:0;font:inherit;-moz-user-select:none}.mydp .headerclearbtn,.mydp .headerokbtn{border-radius:2px;cursor:pointer;font-size:11px;height:20px;width:28px;outline:0}.mydp .btnclearenabled,.mydp .btnpickerenabled,.mydp .headerbtnenabled,.mydp .yearchangebtnenabled{cursor:pointer}.mydp .btncleardisabled,.mydp .btnpickerdisabled,.mydp .clearbtndisabled,.mydp .headerbtndisabled,.mydp .okbtndisabled,.mydp .selectiondisabled,.mydp .yearchangebtndisabled{cursor:not-allowed;opacity:.65}.mydp .selectiondisabled{background-color:#EEE}.mydp .btnclear,.mydp .btnpicker,.mydp .headerclearbtn,.mydp .headerokbtn{background:#FFF}.mydp .header td{vertical-align:middle;border:none;line-height:0}.mydp .header td:nth-child(1){padding-left:4px}.mydp .header td:nth-child(2){text-align:center}.mydp .header td:nth-child(3){padding-right:4px}.mydp .titlearea{text-align:center;background-color:#FFF}.mydp .titleareatxt{height:24px;line-height:24px;font-size:12px;border-bottom:1px solid #EEE}.mydp .inline{position:relative;margin-top:-1px}.mydp .caltable,.mydp .monthtable,.mydp .yeartable{table-layout:fixed;width:100%;background-color:#FFF;font-size:14px}.mydp .caltable,.mydp .daycell,.mydp .monthcell,.mydp .monthtable,.mydp .weekdaytitle,.mydp .yearcell,.mydp .yeartable{border-collapse:collapse;line-height:1.1}.mydp .daycell,.mydp .monthcell,.mydp .weekdaytitle,.mydp .yearcell{padding:4px;text-align:center}.mydp .weekdaytitleweeknbr{width:20px;border-right:1px solid #BBB}.mydp .monthcell{background-color:#FAFAFA}.mydp .yearcell{background-color:#FAFAFA;width:20%}.mydp .daycellweeknbr{font-size:10px;border-right:1px solid #CCC;cursor:default;color:#000}.mydp .sundayDim{opacity:.5}.mydp .currmonth{background-color:#F6F6F6;font-weight:400}.mydp .markcurrday,.mydp .markcurrmonth,.mydp .markcurryear{text-decoration:underline}.mydp .selecteddaybegin,.mydp .selecteddayend,.mydp .selectedmonth .monthvalue,.mydp .selectedyear .yearvalue{border:none;background-color:#8EBFFF;border-radius:2px}.mydp .headerbtncell{background-color:#FFF;cursor:pointer}.mydp .yearchangebtncell{text-align:center;background-color:#FAFAFA}.mydp .headerbtn,.mydp .headerlabelbtn,.mydp .yearchangebtn{background:#FFF;border:none;height:22px}.mydp .headerbtn{width:16px}.mydp .headerlabelbtn{font-size:14px;outline:0;cursor:default}.mydp,.mydp .headerclearbtn,.mydp .headerokbtn{border:1px solid #CCC}.mydp .btnclear,.mydp .btnpicker,.mydp .headerbtn,.mydp .headerclearbtn,.mydp .headermonthtxt,.mydp .headerokbtn,.mydp .headeryeartxt,.mydp .yearchangebtn{color:#000}.mydp button::-moz-focus-inner{border:0}.mydp .headerbtn:focus,.mydp .monthlabel:focus,.mydp .yearchangebtn:focus,.mydp .yearlabel:focus{outline:0}.mydp .icon-mydpcalendar,.mydp .icon-mydpok,.mydp .icon-mydpremove{font-size:16px}.mydp .icon-mydpdown,.mydp .icon-mydpleft,.mydp .icon-mydpright,.mydp .icon-mydpup{color:#222;font-size:20px}.mydp table{display:table;border-spacing:0}.mydp table td{padding:0}.mydp table,.mydp td,.mydp th{border:none}.mydp .daycell,.mydp .inputnoteditable,.mydp .monthcell,.mydp .monthlabel,.mydp .yearcell,.mydp .yearlabel{cursor:pointer}.mydp .btnpicker{width:47px;height:22px}.mydp .icon-mydpcalendar{width:47px;height:22px;display:inline-block}.mydp .icon-mydpcalendar:before{width:47px;height:22px;display:inline-block;content:url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDNweCIgaGVpZ2h0PSIyMXB4IiB2aWV3Qm94PSIwIDAgNDMgMjEiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+ICAgIDxnIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPiAgICAgICAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTIzNi4wMDAwMDAsIC0xODIuMDAwMDAwKSIgZmlsbD0iIzMzMzMzMyI+ICAgICAgICAgICAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjcyLjUwMDAwMCwgMTk1LjAwMDAwMCkgc2NhbGUoLTEsIDEpIHJvdGF0ZSgtMjcwLjAwMDAwMCkgdHJhbnNsYXRlKC0yNzIuNTAwMDAwLCAtMTk1LjAwMDAwMCkgdHJhbnNsYXRlKDI2OS4wMDAwMDAsIDE4OS4wMDAwMDApIiBmaWxsLXJ1bGU9Im5vbnplcm8iPiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNS4wNTU1NTU1Niw2IEwwLjIyOTM5MjIzNywxMC43MTgxNDQ2IEMtMC4wNzUyMjI1MDM0LDExLjAxMDE5MjkgLTAuMDc2NjQwOTcxNiwxMS40ODUwNjQ3IDAuMjI2MjI0LDExLjc3ODgwMDMgQzAuNTI5MDg4OTcxLDEyLjA3MjUzNiAxLjAyMTU0ODU4LDEyLjA3MzkwMzggMS4zMjYxNjMzMiwxMS43ODE4NTU0IEw2Ljc3MDYwNzc2LDYuNTYyMDEyNSBDNy4wNzUyMjYwNiw2LjI2OTk2MDczIDcuMDc2NjQwNDgsNS43OTUwODIyIDYuNzczNzY2OTUsNS41MDEzNDc5NSBMMS4zMjkzMjI1MSwwLjIyMTE5MDg4MyBDMS4wMjY0NTI1MSwtMC4wNzI1Mzk5NDE3IDAuNTMzOTkyODgxLC0wLjA3Mzg5OTkxNTkgMC4yMjkzODMxMzgsMC4yMTgxNTMyOTUgQy0wLjA3NTIyNjYwNjIsMC41MTAyMDY1MDYgLTAuMDc2NjM2OTQ5OCwwLjk4NTA3ODI5MyAwLjIyNjIzMzA0NywxLjI3ODgwOTEyIEw1LjA1NTU1NTU2LDYgWiI+PC9wYXRoPiAgICAgICAgICAgIDwvZz4gICAgICAgICAgICA8cGF0aCBkPSJNMjU1LjU5NTk0NywxODUuMjMzMDA4IEwyNTQuNTUwODMsMTg1LjIzMzAwOCBMMjU0LjU1MDgzLDE4Ni45MzEzMjMgQzI1NC41NTA4MywxODguMTU3NzY4IDI1My41NTYxNCwxODkuMTUyMTk3IDI1Mi4zMjk5NTYsMTg5LjE1MjE5NyBDMjUxLjEwMzc3MiwxODkuMTUyMTk3IDI1MC4xMDkwODIsMTg4LjE1Nzc2OCAyNTAuMTA5MDgyLDE4Ni45MzEzMjMgTDI1MC4xMDkwODIsMTg1LjIzMzAwOCBMMjQyLjc5MzI2MiwxODUuMjMzMDA4IEwyNDIuNzkzMjYyLDE4Ni45MzEzMjMgQzI0Mi43OTMyNjIsMTg4LjE1Nzc2OCAyNDEuNzk4ODMzLDE4OS4xNTIxOTcgMjQwLjU3MjM4OCwxODkuMTUyMTk3IEMyMzkuMzQ1OTQzLDE4OS4xNTIxOTcgMjM4LjM1MTUxNCwxODguMTU3NzY4IDIzOC4zNTE1MTQsMTg2LjkzMTMyMyBMMjM4LjM1MTUxNCwxODUuMjMzMDA4IEwyMzcuMzA2Mzk2LDE4NS4yMzMwMDggQzIzNi41ODQ3NDMsMTg1LjIzMzAwOCAyMzYsMTg1LjgxNzc1MSAyMzYsMTg2LjUzOTQwNCBMMjM2LDIwMS42OTM2MDQgQzIzNiwyMDIuNDE1MjU3IDIzNi41ODQ3NDMsMjAzIDIzNy4zMDYzOTYsMjAzIEwyNTMuNzY2OTkyLDIwMyBMMjU2LjkwMjM0NCwxOTkuODY0NjQ4IEwyNTYuOTAyMzQ0LDE4Ni41Mzk0MDQgQzI1Ni45MDIzNDQsMTg1LjgxNzc1MSAyNTYuMzE3NjAxLDE4NS4yMzMwMDggMjU1LjU5NTk0NywxODUuMjMzMDA4IE0yNTIuMzI5OTU2LDE4OC4xMDcwOCBDMjUzLjEyMzQ2MSwxODguMTA3MDggMjUzLjc2Njk5MiwxODcuNDYzNTQ5IDI1My43NjY5OTIsMTg2LjY3MDA0NCBMMjUzLjc2Njk5MiwxODQuMzE4NTMgQzI1My43NjY5OTIsMTgzLjUyNTAyNSAyNTMuMTIzNDYxLDE4Mi44ODE0OTQgMjUyLjMyOTk1NiwxODIuODgxNDk0IEMyNTEuNTM2NDUxLDE4Mi44ODE0OTQgMjUwLjg5MjkyLDE4My41MjUwMjUgMjUwLjg5MjkyLDE4NC4zMTg1MyBMMjUwLjg5MjkyLDE4Ni42NzAwNDQgQzI1MC44OTI5MiwxODcuNDYzNTQ5IDI1MS41MzY0NTEsMTg4LjEwNzA4IDI1Mi4zMjk5NTYsMTg4LjEwNzA4IE0yNDAuNTcyMzg4LDE4OC4xMDcwOCBDMjQxLjM2NTg5MywxODguMTA3MDggMjQyLjAwOTQyNCwxODcuNDYzNTQ5IDI0Mi4wMDk0MjQsMTg2LjY3MDA0NCBMMjQyLjAwOTQyNCwxODQuMzE4NTMgQzI0Mi4wMDk0MjQsMTgzLjUyNTAyNSAyNDEuMzY1ODkzLDE4Mi44ODE0OTQgMjQwLjU3MjM4OCwxODIuODgxNDk0IEMyMzkuNzc4ODgyLDE4Mi44ODE0OTQgMjM5LjEzNTM1MiwxODMuNTI1MDI1IDIzOS4xMzUzNTIsMTg0LjMxODUzIEwyMzkuMTM1MzUyLDE4Ni42NzAwNDQgQzIzOS4xMzUzNTIsMTg3LjQ2MzU0OSAyMzkuNzc4ODgyLDE4OC4xMDcwOCAyNDAuNTcyMzg4LDE4OC4xMDcwOCI+PC9wYXRoPiAgICAgICAgPC9nPiAgICA8L2c+PC9zdmc+)}.mydp .icon-mydpright:before{content:url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOXB4IiBoZWlnaHQ9IjEzcHgiIHZpZXdCb3g9IjAgMCA5IDEzIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPiAgICA8ZyBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBvcGFjaXR5PSIwLjI1MTQwMzg4Ij4gICAgICAgIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01NzYuMDAwMDAwLCAtMjM1LjAwMDAwMCkiIGZpbGw9IiM1ODU4NTgiPiAgICAgICAgICAgIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIzNi4wMDAwMDAsIDIwMy4wMDAwMDApIj4gICAgICAgICAgICAgICAgPHBvbHlnb24gdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzQ0LjM2ODM1OSwgMzguNjQ4Nzk2KSByb3RhdGUoLTkyLjAwMDAwMCkgdHJhbnNsYXRlKC0zNDQuMzY4MzU5LCAtMzguNjQ4Nzk2KSAiIHBvaW50cz0iMzQ4Ljk2ODM1OSAzNC45NDg3OTYzIDM0NC4zNjgzNTkgMzkuNTQ4Nzk2MyAzMzkuNzY4MzU5IDM0Ljk0ODc5NjMgMzM4LjM2ODM1OSAzNi4zNDg3OTYzIDM0NC4zNjgzNTkgNDIuMzQ4Nzk2MyAzNTAuMzY4MzU5IDM2LjM0ODc5NjMiPjwvcG9seWdvbj4gICAgICAgICAgICA8L2c+ICAgICAgICA8L2c+ICAgIDwvZz48L3N2Zz4=)}.mydp .icon-mydpleft:before{content:url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOXB4IiBoZWlnaHQ9IjEzcHgiIHZpZXdCb3g9IjAgMCA5IDEzIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPiAgICA8ZyBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBvcGFjaXR5PSIwLjI2MjQ4MTMwNSI+ICAgICAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNTQwLjAwMDAwMCwgLTIzNS4wMDAwMDApIiBmaWxsPSIjNTg1ODU4Ij4gICAgICAgICAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMzYuMDAwMDAwLCAyMDMuMDAwMDAwKSI+ICAgICAgICAgICAgICAgIDxwb2x5Z29uIHRyYW5zZm9ybT0idHJhbnNsYXRlKDMwOC4zNjgzNTksIDM4LjY0ODc5Nikgc2NhbGUoLTEsIDEpIHJvdGF0ZSgtOTIuMDAwMDAwKSB0cmFuc2xhdGUoLTMwOC4zNjgzNTksIC0zOC42NDg3OTYpICIgcG9pbnRzPSIzMTIuOTY4MzU5IDM0Ljk0ODc5NjMgMzA4LjM2ODM1OSAzOS41NDg3OTYzIDMwMy43NjgzNTkgMzQuOTQ4Nzk2MyAzMDIuMzY4MzU5IDM2LjM0ODc5NjMgMzA4LjM2ODM1OSA0Mi4zNDg3OTYzIDMxNC4zNjgzNTkgMzYuMzQ4Nzk2MyI+PC9wb2x5Z29uPiAgICAgICAgICAgIDwvZz4gICAgICAgIDwvZz4gICAgPC9nPjwvc3ZnPg==)}.mydp{border:none!important;border-radius:0!important;border-bottom:1px solid #333!important}.mydp .caltable,.mydp .daycell,.mydp .monthcell,.mydp .monthtable,.mydp .sunday,.mydp .weekdaytitle,.mydp .yearcell,.mydp .yeartable{color:#6c6c6c!important}.mydp .caltable.disabled,.mydp .daycell.disabled,.mydp .monthcell.disabled,.mydp .monthtable.disabled,.mydp .sunday.disabled,.mydp .weekdaytitle.disabled,.mydp .yearcell.disabled,.mydp .yeartable.disabled{color:#ccc!important;cursor:default!important}.mydp .markcurrday,.mydp .selectedday .datevalue{border-radius:50%;width:39px;height:39px;display:inline-block;line-height:39px;color:#333!important;font-size:12px;text-decoration:none!important}.mydp .markcurrday{background-color:transparent;border:1px solid #999}.mydp .selectedday .datevalue{background-color:#fed100}.mydp .caltable,.mydp .nextmonth,.mydp .prevmonth,.mydp .weekdaytitle,.mydp tr td,.mydp tr th{background-color:transparent!important}.mydp tr td,.mydp tr th{height:40px}.mydp tr td:first-child,.mydp tr th:first-child{border-left:none!important}.mydp .weekdaytitle{font-weight:400;vertical-align:middle;max-width:36px;color:#000!important;font-size:16px!important}.mydp .nextmonth,.mydp .prevmonth{color:#cacaca!important}.mydp .header,.mydp .header .headerbtncell button{background-color:transparent}.mydp .header{display:flex;position:relative;width:100%;height:30px}.mydp .header .month,.mydp .header .year{width:50%;position:relative}.mydp .header .month{float:left}.mydp .header .headermonthtxt{position:absolute;top:5px;left:0}.mydp .header .headermonthtxt button{background-color:transparent;text-transform:none;font-size:15px;color:#333}.mydp .header .headerbtncell{position:absolute;width:22px;height:22px;border-radius:50%;text-align:center}.mydp .header .headerbtncell.prev{right:40px}.mydp .header .headerbtncell.next{right:10px}.mydp .selectiongroup .seletion{font-size:16px}.mydp .daycell:focus,.mydp .monthcell:focus,.mydp .yearcell:focus{outline:0!important}.mydp .range{background-color:#fea000!important}.mydp .selecteddaybegin,.mydp .selecteddayend{background-color:transparent!important}.mydp .selector,.mydp .selectorarrow{border:none;padding:15px;border-radius:6px;background-color:#f4f4f4;box-shadow:0 50px 100px 0 #ccc}.mydp .selectorarrow{margin-top:12px}.mydp .selectorarrow:after,.mydp .selectorarrow:before,.mydp .titleareatxt{display:none}`],
    template: `<div class="mydp" [ngStyle]="{'width': opts.showInputField ? opts.width : null, 'border': opts.inline ? 'none' : null, 'border-bottom': opts.componentDisabled ? '1px solid #eee' : null }"><div class="selectiongroup" *ngIf="!opts.inline"><input *ngIf="opts.showInputField" #inputBoxEl ngtype="text" class="selection" [attr.aria-label]="opts.ariaLabelInputField" (click)="opts.openSelectorOnInputClick&&!opts.editableDateField&&openBtnClicked()" [ngClass]="{'invaliddate': invalidDate&&opts.indicateInvalidDate, 'inputnoteditable': opts.openSelectorOnInputClick&&!opts.editableDateField, 'selectiondisabled': opts.componentDisabled}" placeholder="{{placeholder}}" [ngStyle]="{'height': opts.height, 'font-size': opts.selectionTxtFontSize}" [ngModel]="selectionDayTxt" (ngModelChange)="onUserDateInput($event)" [value]="selectionDayTxt" (keyup)="onCloseSelector($event)" (focus)="opts.editableDateField&&onFocusInput($event)" (blur)="opts.editableDateField&&onBlurInput($event)" [disabled]="opts.componentDisabled" [readonly]="!opts.editableDateField" autocomplete="off" spellcheck="false" autocorrect="off"><div class="selbtngroup" [style.height]="opts.height"><button type="button" [attr.aria-label]="opts.ariaLabelDecreaseDate" class="btndecrease" *ngIf="opts.showDecreaseDateBtn" (click)="onDecreaseBtnClicked()" [ngClass]="{'btndecreaseenabled': !opts.componentDisabled, 'btndecreasedisabled': opts.componentDisabled, 'btnleftborderradius': !opts.showInputField}" [disabled]="opts.componentDisabled"><span class="mydpicon icon-mydpleft"></span></button> <button type="button" [attr.aria-label]="opts.ariaLabelIncreaseDate" class="btnincrease" *ngIf="opts.showIncreaseDateBtn" (click)="onIncreaseBtnClicked()" [ngClass]="{'btnincreaseenabled': !opts.componentDisabled, 'btnincreasedisabled': opts.componentDisabled, 'btnleftborderradius': !opts.showDecreaseDateBtn&&!opts.showInputField}" [disabled]="opts.componentDisabled"><span class="mydpicon icon-mydpright"></span></button> <button type="button" [attr.aria-label]="opts.ariaLabelOpenCalendar" class="btnpicker" (click)="openBtnClicked()" [ngClass]="{'btnpickerenabled': !opts.componentDisabled, 'btnpickerdisabled': opts.componentDisabled, 'btnleftborderradius': !opts.showClearDateBtn&&!opts.showIncreaseDateBtn&&!opts.showDecreaseDateBtn&&!opts.showInputField||selectionDayTxt.length===0&&!opts.showInputField}" [disabled]="opts.componentDisabled"><span class="mydpicon icon-mydpcalendar"></span></button></div></div><div class="selector" #selectorEl [ngStyle]="{'width': opts.selectorWidth, 'height' : opts.selectorHeight, 'bottom': getSelectorTopPosition()}" *ngIf="showSelector||opts.inline" [mydpfocus]="opts.inline?'0':'1'" [ngClass]="{'inlinedp': opts.inline, 'alignselectorright': opts.alignSelectorRight, 'selectorarrow': opts.showSelectorArrow&&!opts.inline, 'selectorarrowleft': opts.showSelectorArrow&&!opts.alignSelectorRight&&!opts.inline, 'selectorarrowright': opts.showSelectorArrow&&opts.alignSelectorRight&&!opts.inline}" (keyup)="onCloseSelector($event)" tabindex="0"><div class="header"><div class="year" *ngIf="opts.yearSelector"><div class="headermonthtxt">{{ visibleMonth.year }}</div><div class="headerbtncell prev"><button type="button" class="headerbtn mydpicon icon-mydpleft" [attr.aria-label]="opts.ariaLabelPrevYear" (click)="onPrevYear()" [disabled]="prevYearsDisabled" [ngClass]="{'headerbtnenabled': !prevYearsDisabled, 'headerbtndisabled': prevYearsDisabled}"></button></div><div class="headerbtncell next"><button type="button" class="headerbtn mydpicon icon-mydpright" [attr.aria-label]="opts.ariaLabelNextYear" (click)="onNextMonth()" [disabled]="nextYearsDisabled" [ngClass]="{'headerbtnenabled': !nextYearsDisabled, 'headerbtndisabled': nextYearsDisabled}"></button></div></div><div class="month" [ngStyle]="{'width': !opts.yearSelector ? '100%' : '50%'}"><div class="headermonthtxt">{{visibleMonth.monthTxt}}</div><div class="headerbtncell prev"><button type="button" class="headerbtn mydpicon icon-mydpleft" [attr.aria-label]="opts.ariaLabelPrevMonth" (click)="onPrevMonth()" [disabled]="prevMonthDisabled" [ngClass]="{'headerbtnenabled': !prevMonthDisabled, 'headerbtndisabled': prevMonthDisabled}"></button></div><div class="headerbtncell next"><button type="button" class="headerbtn mydpicon icon-mydpright" [attr.aria-label]="opts.ariaLabelNextMonth" (click)="onNextMonth()" [disabled]="nextMonthDisabled" [ngClass]="{'headerbtnenabled': !nextMonthDisabled, 'headerbtndisabled': nextMonthDisabled}"></button></div></div></div><table class="caltable" *ngIf="!selectMonth&&!selectYear"><thead><tr><th class="weekdaytitle weekdaytitleweeknbr" *ngIf="opts.showWeekNumbers&&opts.firstDayOfWeek==='mo'">#</th><th class="weekdaytitle" scope="col" *ngFor="let d of weekDays">{{d}}</th></tr></thead><tbody><tr *ngFor="let w of dates"><td class="daycell daycellweeknbr" *ngIf="opts.showWeekNumbers&&opts.firstDayOfWeek==='mo'">{{w.weekNbr}}</td><td class="daycell" *ngFor="let d of w.week" [ngClass]="{'currmonth':d.cmo===currMonthId&&!d.disabled, 'selectedday':selectedDate.day===d.dateObj.day && selectedDate.month===d.dateObj.month && selectedDate.year===d.dateObj.year && d.cmo===currMonthId, 'disabled': d.disabled, 'tablesingleday': d.cmo===currMonthId&&!d.disabled}" (click)="!d.disabled&&onCellClicked(d);$event.stopPropagation()" (keydown)="onCellKeyDown($event, d)" tabindex="0"><div *ngIf="d.markedDate.marked" class="markdate" [ngStyle]="{'background-color': d.markedDate.color}"></div><div class="datevalue" [ngClass]="{'prevmonth':d.cmo===prevMonthId,'currmonth':d.cmo===currMonthId,'nextmonth':d.cmo===nextMonthId,'highlight':d.highlight}"><span [ngClass]="{'markcurrday':d.currDay&&opts.markCurrentDay, 'dimday': d.highlight && (d.cmo===prevMonthId || d.cmo===nextMonthId || d.disabled)}">{{d.dateObj.day}}</span></div></td></tr></tbody></table><table class="monthtable" *ngIf="selectMonth"><tbody><tr *ngFor="let mr of months"><td class="monthcell tablesinglemonth" [ngClass]="{'selectedmonth': m.selected, 'disabled': m.disabled}" *ngFor="let m of mr" (click)="!m.disabled&&onMonthCellClicked(m);$event.stopPropagation()" (keydown)="onMonthCellKeyDown($event, m)" tabindex="0"><div class="monthvalue" [ngClass]="{'markcurrmonth':m.currMonth&&opts.markCurrentMonth}">{{m.name}}</div></td></tr></tbody></table><table class="yeartable" *ngIf="selectYear"><tbody><tr><td colspan="5" class="yearchangebtncell" (click)="$event.stopPropagation()"><button type="button" class="yearchangebtn mydpicon icon-mydpup" (click)="onPrevYears($event, years[0][0].year)" [disabled]="prevYearsDisabled" [ngClass]="{'yearchangebtnenabled': !prevYearsDisabled, 'yearchangebtndisabled': prevYearsDisabled}"></button></td></tr><tr *ngFor="let yr of years"><td class="yearcell tablesingleyear" [ngClass]="{'selectedyear': y.selected, 'disabled': y.disabled}" *ngFor="let y of yr" (click)="!y.disabled&&onYearCellClicked(y);$event.stopPropagation()" (keydown)="onYearCellKeyDown($event, y)" tabindex="0"><div class="yearvalue" [ngClass]="{'markcurryear':y.currYear&&opts.markCurrentYear}">{{y.year}}</div></td></tr><tr><td colspan="5" class="yearchangebtncell" (click)="$event.stopPropagation()"><button type="button" class="yearchangebtn mydpicon icon-mydpdown" (click)="onNextYears($event, years[0][0].year)" [disabled]="nextYearsDisabled" [ngClass]="{'yearchangebtnenabled': !nextYearsDisabled, 'yearchangebtndisabled': nextYearsDisabled}"></button></td></tr></tbody></table></div></div>`,
    providers: [LocaleService, UtilService, MYDP_VALUE_ACCESSOR],
    encapsulation: ViewEncapsulation.None
})

export class MyDatePicker implements OnChanges, ControlValueAccessor {
    @Input() options: IMyOptions;
    @Input() locale: string;
    @Input() defaultMonth: string;
    @Input() selDate: string;
    @Input() placeholder: string;
    @Input() selector: number;
    @Input() disabled: boolean;
    @Output() dateChanged: EventEmitter<IMyDateModel> = new EventEmitter<IMyDateModel>();
    @Output() inputFieldChanged: EventEmitter<IMyInputFieldChanged> = new EventEmitter<IMyInputFieldChanged>();
    @Output() calendarViewChanged: EventEmitter<IMyCalendarViewChanged> = new EventEmitter<IMyCalendarViewChanged>();
    @Output() calendarToggle: EventEmitter<number> = new EventEmitter<number>();
    @Output() inputFocusBlur: EventEmitter<IMyInputFocusBlur> = new EventEmitter<IMyInputFocusBlur>();
    @ViewChild("selectorEl") selectorEl: ElementRef;
    @ViewChild("inputBoxEl") inputBoxEl: ElementRef;

    onChangeCb: (_: any) => void = () => { };
    onTouchedCb: () => void = () => { };

    showSelector: boolean = false;
    visibleMonth: IMyMonth = {monthTxt: "", monthNbr: 0, year: 0};
    selectedMonth: IMyMonth = {monthTxt: "", monthNbr: 0, year: 0};
    selectedDate: IMyDate = {year: 0, month: 0, day: 0};
    weekDays: Array<string> = [];
    dates: Array<IMyWeek> = [];
    months: Array<Array<IMyCalendarMonth>> = [];
    years: Array<Array<IMyCalendarYear>> = [];
    getYears: Date = new Date();
    selectionDayTxt: string = "";
    invalidDate: boolean = false;
    disableTodayBtn: boolean = false;
    dayIdx: number = 0;

    selectMonth: boolean = true;
    selectYear: boolean = true;

    prevMonthDisabled: boolean = false;
    nextMonthDisabled: boolean = false;
    prevYearDisabled: boolean = false;
    nextYearDisabled: boolean = false;
    prevYearsDisabled: boolean = false;
    nextYearsDisabled: boolean = false;

    prevMonthId: number = MonthId.prev;
    currMonthId: number = MonthId.curr;
    nextMonthId: number = MonthId.next;

    // Default options
    opts: IMyOptions = {
        dayLabels: <IMyDayLabels> {},
        monthLabels: <IMyMonthLabels> {},
        dateFormat: <string> "",
        showTodayBtn: <boolean> true,
        todayBtnTxt: <string> "",
        firstDayOfWeek: <string> "",
        satHighlight: <boolean> false,
        sunHighlight: <boolean> true,
        highlightDates: <Array<IMyDate>> [],
        markCurrentDay: <boolean> true,
        markCurrentMonth: <boolean> true,
        markCurrentYear: <boolean> true,
        disableUntil: <IMyDate> {year: 0, month: 0, day: 0},
        disableSince: <IMyDate> {year: 0, month: 0, day: 0},
        disableDays: <Array<IMyDate>> [],
        enableDays: <Array<IMyDate>> [],
        markDates: <Array<IMyMarkedDates>> [],
        markWeekends: <IMyMarkedDate> {},
        disableDateRanges: <Array<IMyDateRange>> [],
        disableWeekends: <boolean> false,
        disableWeekdays: <Array<string>> [],
        showWeekNumbers: <boolean> false,
        height: <string> "auto",
        width: <string> "100%",
        selectionTxtFontSize: <string> "14px",
        selectorHeight: <string> "auto",
        selectorWidth: <string> "300px",
        allowDeselectDate: <boolean> false,
        inline: <boolean> false,
        showClearDateBtn: <boolean> true,
        showDecreaseDateBtn: <boolean> false,
        showIncreaseDateBtn: <boolean> false,
        alignSelectorRight: <boolean> false,
        openSelectorTopOfInput: <boolean> false,
        indicateInvalidDate: <boolean> true,
        editableDateField: <boolean> true,
        monthSelector: <boolean> true,
        yearSelector: <boolean> true,
        disableHeaderButtons: <boolean> true,
        minYear: <number> Year.min,
        maxYear: <number> Year.max,
        componentDisabled: <boolean> false,
        showSelectorArrow: <boolean> true,
        showInputField: <boolean> true,
        openSelectorOnInputClick: <boolean> false,
        ariaLabelInputField: <string> "Date input field",
        ariaLabelClearDate: <string> "Clear Date",
        ariaLabelDecreaseDate: <string> "Decrease Date",
        ariaLabelIncreaseDate: <string> "Increase Date",
        ariaLabelOpenCalendar: <string> "Open Calendar",
        ariaLabelPrevMonth: <string> "Previous Month",
        ariaLabelNextMonth: <string> "Next Month",
        ariaLabelPrevYear: <string> "Previous Year",
        ariaLabelNextYear: <string> "Next Year"
    };

    constructor(public elem: ElementRef, private renderer: Renderer, private cdr: ChangeDetectorRef, private localeService: LocaleService, private utilService: UtilService) {
        this.setLocaleOptions();
        renderer.listenGlobal("document", "click", (event: any) => {
            if (this.showSelector && event.target && this.elem.nativeElement !== event.target && !this.elem.nativeElement.contains(event.target)) {
                this.showSelector = false;
                this.calendarToggle.emit(CalToggle.CloseByOutClick);
            }
            if (this.opts.monthSelector || this.opts.yearSelector) {
                this.resetMonthYearSelect();
            }
        });
    }

    setLocaleOptions(): void {
        let opts: IMyOptions = this.localeService.getLocaleOptions(this.locale);
        Object.keys(opts).forEach((k) => {
            (<IMyOptions>this.opts)[k] = opts[k];
        });
    }

    setOptions(): void {
        if (this.options !== undefined) {
            Object.keys(this.options).forEach((k) => {
                (<IMyOptions>this.opts)[k] = this.options[k];
            });
        }
        if (this.opts.minYear < Year.min) {
            this.opts.minYear = Year.min;
        }
        if (this.opts.maxYear > Year.max) {
            this.opts.maxYear = Year.max;
        }
        if (this.disabled !== undefined) {
            this.opts.componentDisabled = this.disabled;
        }
    }

    getSelectorTopPosition(): string {
        if (this.opts.openSelectorTopOfInput) {
            return this.elem.nativeElement.children[0].offsetHeight + "px";
        }
    }

    resetMonthYearSelect(): void {
        this.selectMonth = false;
        this.selectYear = false;
    }

    onSelectMonthClicked(event: any): void {
        event.stopPropagation();
        this.selectMonth = !this.selectMonth;
        this.selectYear = true;
        this.cdr.detectChanges();
        if (this.selectMonth) {
            let today: IMyDate = this.getToday();
            this.months.length = 0;
            for (let i = 1; i <= 12; i += 3) {
                let row: Array<IMyCalendarMonth> = [];
                for (let j = i; j < i + 3; j++) {
                    let disabled: boolean = this.utilService.isMonthDisabledByDisableUntil({year: this.visibleMonth.year, month: j, day: this.daysInMonth(j, this.visibleMonth.year)}, this.opts.disableUntil)
                        || this.utilService.isMonthDisabledByDisableSince({year: this.visibleMonth.year, month: j, day: 1}, this.opts.disableSince);
                    row.push({nbr: j, name: this.opts.monthLabels[j], currMonth: j === today.month && this.visibleMonth.year === today.year, selected: j === this.visibleMonth.monthNbr, disabled: disabled});
                }
                this.months.push(row);
            }
        }
    }

    onMonthCellClicked(cell: IMyCalendarMonth): void {
        let mc: boolean = cell.nbr !== this.visibleMonth.monthNbr;
        this.visibleMonth = {monthTxt: this.monthText(cell.nbr), monthNbr: cell.nbr, year: this.visibleMonth.year};
        this.generateCalendar(cell.nbr, this.visibleMonth.year, mc);
        this.selectMonth = false;
        this.selectorEl.nativeElement.focus();
    }

    onMonthCellKeyDown(event: any, cell: IMyCalendarMonth) {
        if ((event.keyCode === KeyCode.enter || event.keyCode === KeyCode.space) && !cell.disabled) {
            event.preventDefault();
            this.onMonthCellClicked(cell);
        }
    }

    onSelectYearClicked(event: any): void {
        event.stopPropagation();
        this.selectYear = !this.selectYear;
        this.selectMonth = true;
        this.cdr.detectChanges();
        if (this.selectYear) {
            this.generateYears(this.visibleMonth.year);
        }
    }

    onYearCellClicked(cell: IMyCalendarYear): void {
        let yc: boolean = cell.year !== this.visibleMonth.year;
        this.visibleMonth = {monthTxt: this.visibleMonth.monthTxt, monthNbr: this.visibleMonth.monthNbr, year: cell.year};
        this.generateCalendar(this.visibleMonth.monthNbr, cell.year, yc);
        this.selectYear = true;
        this.selectorEl.nativeElement.focus();
    }

    onYearCellKeyDown(event: any, cell: IMyCalendarYear) {
        if ((event.keyCode === KeyCode.enter || event.keyCode === KeyCode.space) && !cell.disabled) {
            event.preventDefault();
            this.onYearCellClicked(cell);
        }
    }

    onPrevYears(event: any, year: number): void {
        event.stopPropagation();
        this.generateYears(year - 25);
    }

    onNextYears(event: any, year: number): void {
        event.stopPropagation();
        this.generateYears(year + 25);
    }

    generateYears(year: number): void {
        this.years.length = 0;
        let today: IMyDate = this.getToday();
        for (let i = year; i <= 20 + year; i += 5) {
            let row: Array<IMyCalendarYear> = [];
            for (let j = i; j < i + 5; j++) {
                let disabled: boolean = this.utilService.isMonthDisabledByDisableUntil({year: j, month: this.visibleMonth.monthNbr, day: this.daysInMonth(this.visibleMonth.monthNbr, j)}, this.opts.disableUntil)
                 || this.utilService.isMonthDisabledByDisableSince({year: j, month: this.visibleMonth.monthNbr, day: 1}, this.opts.disableSince);
                let minMax: boolean = j < this.opts.minYear || j > this.opts.maxYear;
                row.push({year: j, currYear: j === today.year, selected: j === this.visibleMonth.year, disabled: disabled || minMax});
            }
            this.years.push(row);
        }
        this.prevYearsDisabled = this.years[0][0].year <= this.opts.minYear || this.utilService.isMonthDisabledByDisableUntil({year: this.years[0][0].year - 1, month: this.visibleMonth.monthNbr, day: this.daysInMonth(this.visibleMonth.monthNbr, this.years[0][0].year - 1)}, this.opts.disableUntil);
        this.nextYearsDisabled = this.years[4][4].year >= this.opts.maxYear || this.utilService.isMonthDisabledByDisableSince({year: this.years[4][4].year + 1, month: this.visibleMonth.monthNbr, day: 1}, this.opts.disableSince);
    }

    onUserDateInput(value: string): void {
        if (value.length === 0) {
            if (this.utilService.isInitializedDate(this.selectedDate)) {
                this.clearDate();
            }
            else {
                this.invalidInputFieldChanged(value);
            }
        }
        else {
            let date: IMyDate = this.utilService.isDateValid(value, this.opts.dateFormat, this.opts.minYear, this.opts.maxYear, this.opts.disableUntil, this.opts.disableSince, this.opts.disableWeekends, this.opts.disableWeekdays, this.opts.disableDays, this.opts.disableDateRanges, this.opts.monthLabels, this.opts.enableDays);
            if (date.day !== 0 && date.month !== 0 && date.year !== 0) {
                if (!this.utilService.isSameDate(date, this.selectedDate)) {
                    this.selectDate(date, CalToggle.CloseByDateSel);
                }
                else {
                    this.updateDateValue(date, false);
                }
            }
            else {
                this.invalidInputFieldChanged(value);
            }
        }
    }

    onFocusInput(event: any): void {
        this.inputFocusBlur.emit({reason: InputFocusBlur.focus, value: event.target.value});
    }

    onBlurInput(event: any): void {
        this.selectionDayTxt = event.target.value;
        this.onTouchedCb();
        this.inputFocusBlur.emit({reason: InputFocusBlur.blur, value: event.target.value});
    }

    onCloseSelector(event: any): void {
        if (event.keyCode === KeyCode.esc && this.showSelector && !this.opts.inline) {
            this.calendarToggle.emit(CalToggle.CloseByEsc);
            this.showSelector = false;
        }
    }

    invalidInputFieldChanged(value: string): void {
        this.invalidDate = value.length > 0;
        this.inputFieldChanged.emit({value: value, dateFormat: this.opts.dateFormat, valid: false});
        this.onChangeCb(null);
        this.onTouchedCb();
    }

    isTodayDisabled(): void {
        this.disableTodayBtn = this.utilService.isDisabledDay(this.getToday(), this.opts.minYear, this.opts.maxYear, this.opts.disableUntil, this.opts.disableSince, this.opts.disableWeekends, this.opts.disableWeekdays, this.opts.disableDays, this.opts.disableDateRanges, this.opts.enableDays);
    }

    parseOptions(): void {
        if (this.locale) {
            this.setLocaleOptions();
        }
        this.setOptions();
        let weekDays: Array<string> = this.utilService.getWeekDays();
        this.isTodayDisabled();
        this.dayIdx = weekDays.indexOf(this.opts.firstDayOfWeek);
        if (this.dayIdx !== -1) {
            let idx: number = this.dayIdx;
            for (let i = 0; i < weekDays.length; i++) {
                this.weekDays.push(this.opts.dayLabels[weekDays[idx]]);
                idx = weekDays[idx] === "sa" ? 0 : idx + 1;
            }
        }
    }

    writeValue(value: any): void {
        if (value && (value["date"] || value["jsdate"] || value["formatted"])) {
            this.selectedDate = value["date"] ? this.parseSelectedDate(value["date"]) : value["jsdate"] ? this.parseSelectedDate(this.jsDateToMyDate(value["jsdate"])) : this.parseSelectedDate(value["formatted"]);
            let cvc: boolean = this.visibleMonth.year !== this.selectedDate.year || this.visibleMonth.monthNbr !== this.selectedDate.month;
            if (cvc) {
                this.visibleMonth = {monthTxt: this.opts.monthLabels[this.selectedDate.month], monthNbr: this.selectedDate.month, year: this.selectedDate.year};
                this.generateCalendar(this.selectedDate.month, this.selectedDate.year, cvc);
            }
            if (!this.opts.inline) {
                this.updateDateValue(this.selectedDate, false);
            }
        }
        else if (value === null || value === "") {
            if (!this.opts.inline) {
                this.updateDateValue({year: 0, month: 0, day: 0}, true);
            }
            else {
                this.selectedDate = {year: 0, month: 0, day: 0};
            }
        }
    }

    setDisabledState(disabled: boolean): void {
        this.opts.componentDisabled = disabled;
    }

    registerOnChange(fn: any): void {
        this.onChangeCb = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouchedCb = fn;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.hasOwnProperty("selector")) {
            let s: any = changes["selector"].currentValue;
            if (typeof s === "object") {
                if (s.open) {
                    this.showSelector = true;
                    this.openSelector(CalToggle.Open);
                }
                else {
                    this.showSelector = false;
                    this.closeSelector(CalToggle.CloseByApi);
                }
            }
            else if (s > 0) {
                this.openBtnClicked();
            }
        }

        if (changes.hasOwnProperty("placeholder")) {
            this.placeholder = changes["placeholder"].currentValue;
        }

        if (changes.hasOwnProperty("locale")) {
            this.locale = changes["locale"].currentValue;
        }

        if (changes.hasOwnProperty("disabled")) {
            this.disabled = changes["disabled"].currentValue;
        }

        if (changes.hasOwnProperty("options")) {
            this.options = changes["options"].currentValue;
        }

        this.weekDays.length = 0;
        this.parseOptions();

        let dmChange: boolean = false;
        if (changes.hasOwnProperty("defaultMonth")) {
            let dm: any = changes["defaultMonth"].currentValue;
            if (typeof dm === "object") {
                dm = dm.defMonth;
            }
            if (dm !== null && dm !== undefined && dm !== "") {
                this.selectedMonth = this.parseSelectedMonth(dm);
            }
            else {
                this.selectedMonth = {monthTxt: "", monthNbr: 0, year: 0};
            }
            dmChange = true;
        }

        if (changes.hasOwnProperty("selDate")) {
            let sd: any = changes["selDate"];
            if (sd.currentValue !== null && sd.currentValue !== undefined && sd.currentValue !== "" && Object.keys(sd.currentValue).length !== 0) {
                this.selectedDate = this.parseSelectedDate(sd.currentValue);
                setTimeout(() => {
                    this.onChangeCb(this.getDateModel(this.selectedDate));
                });
            }
            else {
                // Do not clear on init
                if (!sd.isFirstChange()) {
                    this.clearDate();
                }
            }
        }
        if (this.visibleMonth.year === 0 && this.visibleMonth.monthNbr === 0 || dmChange) {
            this.setVisibleMonth();
        }
        else {
            this.visibleMonth.monthTxt = this.opts.monthLabels[this.visibleMonth.monthNbr];
            this.generateCalendar(this.visibleMonth.monthNbr, this.visibleMonth.year, false);
        }
    }

    removeBtnClicked(): void {
        // Remove date button clicked
        this.clearDate();
        if (this.showSelector) {
            this.calendarToggle.emit(CalToggle.CloseByCalBtn);
        }
        this.showSelector = false;
    }

    onDecreaseBtnClicked(): void {
        // Decrease date button clicked
        this.decreaseIncreaseDate(true);
    }

    onIncreaseBtnClicked(): void {
        // Increase date button clicked
        this.decreaseIncreaseDate(false);
    }

    openBtnClicked(): void {
        // Open selector button clicked
        this.showSelector = !this.showSelector;
        this.cdr.detectChanges();
        if (this.showSelector) {
            this.openSelector(CalToggle.Open);
        }
        else {
            this.closeSelector(CalToggle.CloseByCalBtn);
        }
    }

    openSelector(reason: number): void {
        this.setVisibleMonth();
        this.calendarToggle.emit(reason);
    }

    closeSelector(reason: number): void {
        this.calendarToggle.emit(reason);
    }

    setVisibleMonth(): void {
        // Sets visible month of calendar
        let y: number = 0, m: number = 0;
        if (!this.utilService.isInitializedDate(this.selectedDate)) {
            if (this.selectedMonth.year === 0 && this.selectedMonth.monthNbr === 0) {
                let today: IMyDate = this.getToday();
                y = today.year;
                m = today.month;
            } else {
                y = this.selectedMonth.year;
                m = this.selectedMonth.monthNbr;
            }
        }
        else {
            y = this.selectedDate.year;
            m = this.selectedDate.month;
        }
        this.visibleMonth = {monthTxt: this.opts.monthLabels[m], monthNbr: m, year: y};

        // Create current month
        this.generateCalendar(m, y, true);
    }

    onPrevMonth(): void {
        // Previous month from calendar
        let d: Date = this.getDate(this.visibleMonth.year, this.visibleMonth.monthNbr, 1);
        d.setMonth(d.getMonth() - 1);

        let y: number = d.getFullYear();
        let m: number = d.getMonth() + 1;

        this.visibleMonth = {monthTxt: this.monthText(m), monthNbr: m, year: y};
        this.generateCalendar(m, y, true);
    }

    onNextMonth(): void {
        // Next month from calendar
        let d: Date = this.getDate(this.visibleMonth.year, this.visibleMonth.monthNbr, 1);
        d.setMonth(d.getMonth() + 1);

        let y: number = d.getFullYear();
        let m: number = d.getMonth() + 1;

        this.visibleMonth = {monthTxt: this.monthText(m), monthNbr: m, year: y};
        this.generateCalendar(m, y, true);
    }

    onPrevYear(): void {
        // Previous year from calendar
        this.visibleMonth.year--;
        this.generateCalendar(this.visibleMonth.monthNbr, this.visibleMonth.year, true);
    }

    onNextYear(): void {
        // Next year from calendar
        this.visibleMonth.year++;
        this.generateCalendar(this.visibleMonth.monthNbr, this.visibleMonth.year, true);
    }

    onTodayClicked(): void {
        // Today button clicked
        let today: IMyDate = this.getToday();
        this.selectDate(today, CalToggle.CloseByDateSel);
        if (this.opts.inline && today.year !== this.visibleMonth.year || today.month !== this.visibleMonth.monthNbr) {
            this.visibleMonth = {monthTxt: this.opts.monthLabels[today.month], monthNbr: today.month, year: today.year};
            this.generateCalendar(today.month, today.year, true);
        }
    }

    onCellClicked(cell: any): void {
        // Cell clicked on the calendar
        if (cell.cmo === this.prevMonthId) {
            // Previous month day
            this.onPrevMonth();
        }
        else if (cell.cmo === this.currMonthId) {
            // Current month day - if date is already selected clear it
            if (this.opts.allowDeselectDate && this.utilService.isSameDate(cell.dateObj, this.selectedDate)) {
                this.clearDate();
            }
            else {
                this.selectDate(cell.dateObj, CalToggle.CloseByDateSel);
            }
        }
        else if (cell.cmo === this.nextMonthId) {
            // Next month day
            this.onNextMonth();
        }
        this.resetMonthYearSelect();
    }

    onCellKeyDown(event: any, cell: any) {
        // Cell keyboard handling
        if ((event.keyCode === KeyCode.enter || event.keyCode === KeyCode.space) && !cell.disabled) {
            event.preventDefault();
            this.onCellClicked(cell);
        }
    }

    clearDate(): void {
        // Clears the date and notifies parent using callbacks and value accessor
        let date: IMyDate = {year: 0, month: 0, day: 0};
        this.dateChanged.emit({date: date, jsdate: null, formatted: "", epoc: 0});
        this.onChangeCb(null);
        this.onTouchedCb();
        this.updateDateValue(date, true);
        this.setFocusToInputBox();
    }

    decreaseIncreaseDate(decrease: boolean): void {
        // Decreases or increases the date depending on the parameter
        let date: IMyDate = this.selectedDate;
        if (this.utilService.isInitializedDate(date)) {
            let d: Date = this.getDate(date.year, date.month, date.day);
            d.setDate(decrease ? d.getDate() - 1 : d.getDate() + 1);
            date = {year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate()};
        }
        else {
            date = this.getToday();
        }
        this.selectDate(date, CalToggle.CloseByCalBtn);
    }

    selectDate(date: IMyDate, closeReason: number): void {
        // Date selected, notifies parent using callbacks and value accessor
        let dateModel: IMyDateModel = this.getDateModel(date);
        this.dateChanged.emit(dateModel);
        this.onChangeCb(dateModel);
        this.onTouchedCb();
        this.updateDateValue(date, false);
        if (this.showSelector) {
            this.calendarToggle.emit(closeReason);
        }
        this.showSelector = false;
        this.setFocusToInputBox();
    }

    setFocusToInputBox(): void {
        if (!this.opts.inline) {
            setTimeout(() => {
                this.inputBoxEl.nativeElement.focus();
            }, 10);
        }
    }

    updateDateValue(date: IMyDate, clear: boolean): void {
        // Updates date values
        this.selectedDate = date;
        this.selectionDayTxt = clear ? "" : this.formatDate(date);
        this.inputFieldChanged.emit({value: this.selectionDayTxt, dateFormat: this.opts.dateFormat, valid: !clear});
        this.invalidDate = false;
    }

    getDateModel(date: IMyDate): IMyDateModel {
        // Creates a date model object from the given parameter
        return {date: date, jsdate: this.getDate(date.year, date.month, date.day), formatted: this.formatDate(date), epoc: Math.round(this.getTimeInMilliseconds(date) / 1000.0)};
    }

    preZero(val: string): string {
        // Prepend zero if smaller than 10
        return parseInt(val) < 10 ? "0" + val : val;
    }

    formatDate(val: any): string {
        // Returns formatted date string, if mmm is part of dateFormat returns month as a string
        let formatted: string = this.opts.dateFormat.replace(YYYY, val.year).replace(DD, this.preZero(val.day));
        return this.opts.dateFormat.indexOf(MMM) !== -1 ? formatted.replace(MMM, this.monthText(val.month)) : formatted.replace(MM, this.preZero(val.month));
    }

    monthText(m: number): string {
        // Returns month as a text
        return this.opts.monthLabels[m];
    }

    monthStartIdx(y: number, m: number): number {
        // Month start index
        let d = new Date();
        d.setDate(1);
        d.setMonth(m - 1);
        d.setFullYear(y);
        let idx = d.getDay() + this.sundayIdx();
        return idx >= 7 ? idx - 7 : idx;
    }

    daysInMonth(m: number, y: number): number {
        // Return number of days of current month
        return new Date(y, m, 0).getDate();
    }

    daysInPrevMonth(m: number, y: number): number {
        // Return number of days of the previous month
        let d: Date = this.getDate(y, m, 1);
        d.setMonth(d.getMonth() - 1);
        return this.daysInMonth(d.getMonth() + 1, d.getFullYear());
    }

    isCurrDay(d: number, m: number, y: number, cmo: number, today: IMyDate): boolean {
        // Check is a given date the today
        return d === today.day && m === today.month && y === today.year && cmo === this.currMonthId;
    }

    getToday(): IMyDate {
        let date: Date = new Date();
        return {year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate()};
    }

    getTimeInMilliseconds(date: IMyDate): number {
        return this.getDate(date.year, date.month, date.day).getTime();
    }

    getWeekday(date: IMyDate): string {
        // Get weekday: su, mo, tu, we ...
        let weekDays: Array<string> = this.utilService.getWeekDays();
        return weekDays[this.utilService.getDayNumber(date)];
    }

    getDate(year: number, month: number, day: number): Date {
        // Creates a date object from given year, month and day
        return new Date(year, month - 1, day, 0, 0, 0, 0);
    }

    sundayIdx(): number {
        // Index of Sunday day
        return this.dayIdx > 0 ? 7 - this.dayIdx : 0;
    }

    generateCalendar(m: number, y: number, notifyChange: boolean): void {
        this.dates.length = 0;
        let today: IMyDate = this.getToday();
        let monthStart: number = this.monthStartIdx(y, m);
        let dInThisM: number = this.daysInMonth(m, y);
        let dInPrevM: number = this.daysInPrevMonth(m, y);

        let dayNbr: number = 1;
        let cmo: number = this.prevMonthId;
        for (let i = 1; i < 7; i++) {
            let week: Array<IMyCalendarDay> = [];
            if (i === 1) {
                // First week
                let pm = dInPrevM - monthStart + 1;
                // Previous month
                for (let j = pm; j <= dInPrevM; j++) {
                    let date: IMyDate = {year: m === 1 ? y - 1 : y, month: m === 1 ? 12 : m - 1, day: j};
                    week.push({dateObj: date, cmo: cmo, currDay: this.isCurrDay(j, m, y, cmo, today),
                        disabled: this.utilService.isDisabledDay(date, this.opts.minYear, this.opts.maxYear, this.opts.disableUntil, this.opts.disableSince, this.opts.disableWeekends, this.opts.disableWeekdays, this.opts.disableDays, this.opts.disableDateRanges, this.opts.enableDays),
                        markedDate: this.utilService.isMarkedDate(date, this.opts.markDates, this.opts.markWeekends),
                        highlight: this.utilService.isHighlightedDate(date, this.opts.sunHighlight, this.opts.satHighlight, this.opts.highlightDates)});
                }

                cmo = this.currMonthId;
                // Current month
                let daysLeft: number = 7 - week.length;
                for (let j = 0; j < daysLeft; j++) {
                    let date: IMyDate = {year: y, month: m, day: dayNbr};
                    week.push({dateObj: date, cmo: cmo, currDay: this.isCurrDay(dayNbr, m, y, cmo, today),
                        disabled: this.utilService.isDisabledDay(date, this.opts.minYear, this.opts.maxYear, this.opts.disableUntil, this.opts.disableSince, this.opts.disableWeekends, this.opts.disableWeekdays, this.opts.disableDays, this.opts.disableDateRanges, this.opts.enableDays),
                        markedDate: this.utilService.isMarkedDate(date, this.opts.markDates, this.opts.markWeekends),
                        highlight: this.utilService.isHighlightedDate(date, this.opts.sunHighlight, this.opts.satHighlight, this.opts.highlightDates)});
                    dayNbr++;
                }
            }
            else {
                // Rest of the weeks
                for (let j = 1; j < 8; j++) {
                    if (dayNbr > dInThisM) {
                        // Next month
                        dayNbr = 1;
                        cmo = this.nextMonthId;
                    }
                    let date: IMyDate = {year: cmo === this.nextMonthId && m === 12 ? y + 1 : y, month: cmo === this.currMonthId ? m : cmo === this.nextMonthId && m < 12 ? m + 1 : 1, day: dayNbr};
                    week.push({dateObj: date, cmo: cmo, currDay: this.isCurrDay(dayNbr, m, y, cmo, today),
                        disabled: this.utilService.isDisabledDay(date, this.opts.minYear, this.opts.maxYear, this.opts.disableUntil, this.opts.disableSince, this.opts.disableWeekends, this.opts.disableWeekdays, this.opts.disableDays, this.opts.disableDateRanges, this.opts.enableDays),
                        markedDate: this.utilService.isMarkedDate(date, this.opts.markDates, this.opts.markWeekends),
                        highlight: this.utilService.isHighlightedDate(date, this.opts.sunHighlight, this.opts.satHighlight, this.opts.highlightDates)});
                    dayNbr++;
                }
            }
            let weekNbr: number = this.opts.showWeekNumbers  && this.opts.firstDayOfWeek === "mo" ? this.utilService.getWeekNumber(week[0].dateObj) : 0;
            this.dates.push({week: week, weekNbr: weekNbr});
        }

        this.setHeaderBtnDisabledState(m, y);

        if (notifyChange) {
            // Notify parent
            this.calendarViewChanged.emit({year: y, month: m, first: {number: 1, weekday: this.getWeekday({year: y, month: m, day: 1})}, last: {number: dInThisM, weekday: this.getWeekday({year: y, month: m, day: dInThisM})}});
        }
    }

    parseSelectedDate(selDate: any): IMyDate {
        // Parse date value - it can be string or IMyDate object
        let date: IMyDate = {day: 0, month: 0, year: 0};
        if (typeof selDate === "string") {
            let sd: string = <string> selDate;
            let df: string = this.opts.dateFormat;

            date.month = df.indexOf(MMM) !== -1
                ? this.utilService.parseDatePartMonthName(df, sd, MMM, this.opts.monthLabels)
                : this.utilService.parseDatePartNumber(df, sd, MM);

            if (df.indexOf(MMM) !== -1 && this.opts.monthLabels[date.month]) {
                df = this.utilService.changeDateFormat(df, this.opts.monthLabels[date.month].length);
            }

            date.day = this.utilService.parseDatePartNumber(df, sd, DD);
            date.year = this.utilService.parseDatePartNumber(df, sd, YYYY);
        }
        else if (typeof selDate === "object") {
            date = selDate;
        }
        this.selectionDayTxt = this.formatDate(date);
        return date;
    }

    jsDateToMyDate(date: Date): IMyDate {
        return {year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate()};
    }

    parseSelectedMonth(ms: string): IMyMonth {
        return this.utilService.parseDefaultMonth(ms);
    }

    setHeaderBtnDisabledState(m: number, y: number): void {
        let dpm: boolean = false;
        let dpy: boolean = false;
        let dnm: boolean = false;
        let dny: boolean = false;
        if (this.opts.disableHeaderButtons) {
            dpm = this.utilService.isMonthDisabledByDisableUntil({year: m === 1 ? y - 1 : y, month: m === 1 ? 12 : m - 1, day: this.daysInMonth(m === 1 ? 12 : m - 1, m === 1 ? y - 1 : y)}, this.opts.disableUntil);
            dpy = this.utilService.isMonthDisabledByDisableUntil({year: y - 1, month: m, day: this.daysInMonth(m, y - 1)}, this.opts.disableUntil);
            dnm = this.utilService.isMonthDisabledByDisableSince({year: m === 12 ? y + 1 : y, month: m === 12 ? 1 : m + 1, day: 1}, this.opts.disableSince);
            dny = this.utilService.isMonthDisabledByDisableSince({year: y + 1, month: m, day: 1}, this.opts.disableSince);
        }
        this.prevMonthDisabled = m === 1 && y === this.opts.minYear || dpm;
        this.prevYearDisabled = y - 1 < this.opts.minYear || dpy;
        this.nextMonthDisabled = m === 12 && y === this.opts.maxYear || dnm;
        this.nextYearDisabled = y + 1 > this.opts.maxYear || dny;
    }
}
