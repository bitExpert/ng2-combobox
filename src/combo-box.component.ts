import {Component, OnInit, Input, Output, EventEmitter, forwardRef, ViewChild} from '@angular/core';
import {Observable, Subscription} from 'rxjs/Rx';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
    moduleId: 'ng2-combobox',
    selector: 'combo-box',
    template: `
        <div class="field-wrap">
            <input #inputField class="{{inputClass}}" type="text"
                   [(ngModel)]="currVal"
                   (keydown)="onKeyDown($event)"
                   (blur)="onFieldBlur($event)"
                   (focus)="onFieldFocus()">
        
            <div class="icons">
                <i *ngIf="loading" class="{{loadingIconClass}}"></i>
                <i *ngIf="!loading" (click)="onTriggerClick()" class="{{triggerIconClass}}"></i>
            </div>
        
            <div class="list" *ngIf="data && !hideList" (mouseenter)="onMouseEnterList($event)" (mouseleave)="onMouseLeaveList($event)">
                <div *ngFor="let item of data;let index = index;"
                     [ngClass]="{'item': true, 'marked': isMarked(item), 'disabled': isDisabled(item)}"
                     (click)="onItemClick(index, item)">
                    {{getDisplayValue(item)}}
                </div>
            </div>
        </div>
    `,
    styles: [`
        .field-wrap {
            position: relative;
        }
                
        .list {
            position: absolute;
            width: 100%;
            height: auto;
            background-color: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
            z-index: 9999;
            max-height: 200px;
            overflow: auto;
        }
        
        .list .item {
            padding: 10px 20px;
            cursor: pointer;
        }
        
        .list .item.marked,
        .list .item:hover{
            background-color: #ecf0f5;
        }
        
        .list .item.marked {
            font-weight: bold;
        }
        
        .list .item.disabled {
            opacity: .5;
        }
        
        .icons {
            position: absolute;
            right: 8px;
            top: 0px;
            height: 100%;
        }
        
        .icons i {
            height: 20px;
            width: 20px;
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            margin: auto auto auto -20px;
        }
        
        .loader {
            background-image: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0nMzhweCcgaGVpZ2h0PSczOHB4JyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCIgY2xhc3M9InVpbC1yZWxvYWQiPgogICAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9Im5vbmUiIGNsYXNzPSJiayI+PC9yZWN0PgogICAgPGc+CiAgICAgICAgPHBhdGggZD0iTTUwIDE1QTM1IDM1IDAgMSAwIDc0Ljc4NyAyNS4yMTMiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgzOCwzOCwzOCwwLjkzKSIgc3Ryb2tlLXdpZHRoPSIxMnB4Ij48L3BhdGg+CiAgICAgICAgPHBhdGggZD0iTTUwIDBMNTAgMzBMNjYgMTVMNTAgMCIgZmlsbD0icmdiYSgzOCwzOCwzOCwwLjkzKSI+PC9wYXRoPgogICAgICAgIDxhbmltYXRlVHJhbnNmb3JtIGF0dHJpYnV0ZU5hbWU9InRyYW5zZm9ybSIgdHlwZT0icm90YXRlIiBmcm9tPSIwIDUwIDUwIiB0bz0iMzYwIDUwIDUwIiBkdXI9IjFzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSI+PC9hbmltYXRlVHJhbnNmb3JtPgogICAgPC9nPgo8L3N2Zz4=');
            background-size: cover;
        }
        
        .trigger {
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center center;
            background-image: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iRWJlbmVfM19Lb3BpZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4Ig0KCSB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1OSAzMS45IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1OSAzMS45OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPg0KCS5zdDB7ZmlsbDpub25lO3N0cm9rZTojMDAwMDAwO3N0cm9rZS13aWR0aDoxLjU7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fQ0KPC9zdHlsZT4NCjxwb2x5bGluZSBjbGFzcz0ic3QwIiBwb2ludHM9IjU3LjYsMS44IDI5LjUsMjkuOCAyOS41LDI5LjggMS41LDEuOCAiLz4NCjwvc3ZnPg0K");
            cursor: pointer;
        }
    `],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => ComboBoxComponent),
        multi: true
    }]
})
export class ComboBoxComponent implements ControlValueAccessor, OnInit {

    @Input()
    displayField: string;
    @Input()
    valueField: string;
    @Input()
    remote: boolean = false;
    @Input()
    clearOnSelect: boolean = false;
    @Input()
    forceSelection: boolean = true;
    @Input()
    localFilter: boolean = false;
    @Input()
    typeAheadDelay: number = 500;
    @Input()
    inputClass: string = 'form-control';
    @Input()
    loadingIconClass: string = 'loader';
    @Input()
    triggerIconClass: string = 'trigger';
    @Input()
    dataRoot: string = '';
    @Input()
    disabledField: string = null;
    @Input()
    editable: boolean = true;

    @Output()
    onQuery = new EventEmitter<string>();
    @Output()
    onSelect = new EventEmitter<string>();
    @Output()
    onCreate = new EventEmitter<string>();
    @Output()
    onBlur = new EventEmitter<any>();
    @Output()
    onInitValue = new EventEmitter<string>();

    @ViewChild('inputField') _input;

    hideList: boolean = true;
    data: any[];

    private _loading: boolean = false;
    private _listDataSubscription: Subscription;
    private _aheadTimer: number;
    private _currVal: string;
    private _marked: number = null;
    private _initialData: any[];
    private _hasFocus: boolean = false;
    private _tmpVal: any;
    private _enterCued: boolean = false;
    private _noBlur: boolean = false;

    // ControlValueAccessor props
    private propagateTouch = () => {
    };
    private propagateChange = (_: any) => {
    };

    constructor() {
    }

    ngOnInit() {
    }

    @Input()
    set listData(value: Observable<Object[]> | Object[]) {
        if (this._listDataSubscription) {
            this._listDataSubscription.unsubscribe();
        }

        if (value instanceof Observable) {
            const listData = <Observable<Object[]>>value;
            this._listDataSubscription = listData.subscribe((data: any) => {
                // todo: make dataRoot work for all depths
                if (this.dataRoot) {
                    data = <Object[]>data[this.dataRoot];
                }
                this.data = this._initialData = data;
                this.loading = false;
                if (0 === this._tmpVal || this._tmpVal) {
                    this.writeValue(this._tmpVal);
                }
            });
        } else {
            let data = <Object[]>value;
            this.data = this._initialData = data;
            this.loading = false;
        }
    }

    @Input()
    set currVal(value: string) {
        this._currVal = value;
        this._tmpVal = null;
        this.marked = null;
        this.hideList = !this._hasFocus && !this._noBlur;

        clearTimeout(this._aheadTimer);
        if (!this._currVal) {
            this.sendModelChange(null);
        }

        this._aheadTimer = setTimeout(this.loadData.bind(this), this.typeAheadDelay);
    }

    get currVal(): string {
        return this._currVal;
    }

    // todo: scroll marked into view
    set marked(value: number) {
        if (null === value) {
            this._marked = value;
        } else if (this.data && 0 <= value && this.data.length >= value - 1) {
            this._marked = value;
            // use private var to prevent query trigger
            this._currVal = this.getDisplayValue(this.data[this._marked]);
        }
    }

    get marked(): number {
        return this._marked;
    }

    set loading(loading: boolean) {
        this._loading = loading;
        if(!loading && this._enterCued) {
            this._enterCued = false;
            this.handleEnter();
        }
    }

    get loading(): boolean {
        return this._loading;
    }

    onKeyDown(event: KeyboardEvent) {
        const code = event.which || event.keyCode;
        switch (code) {
            case 13:
                event.preventDefault();
                this.handleEnter();
                break;
            case 38:
                this.handleUp();
                break;
            case 40:
                this.handleDown();
                break;
            default:
                if (!this.editable) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    return false;
                }
                break;
        }
    }

    onItemClick(index: number, item: Object) {
        if (this.isDisabled(item)) {
            return;
        }
        this._noBlur = false;
        this.marked = index;

        this.onSelect.emit(this.data[this.marked]);
        this.sendModelChange(this.data[this.marked]);

        if (this.clearOnSelect) {
            this.clear();
        } else {
            this.hideList = true;
        }
        if (!this.remote && !this.localFilter) {
            this.data = this._initialData;
        }
    }

    onFieldBlur(event: FocusEvent) {
        this._hasFocus = false;
        if (this._noBlur) {
            return;
        }

        this.onBlur.emit(event);
        // timeout for hide to catch click event on list :-(
        setTimeout(() => {
            this.handleEnter();
        }, 200);

        this.propagateTouch();
    }

    onFieldFocus() {
        this._hasFocus = true;
        this.hideList = false;
        if (!this.editable) {
            this.clear();
        }
        this.loadData();
    }

    onMouseEnterList() {
        this._noBlur = true;
    }

    onMouseLeaveList() {
        this._noBlur = false;
    }

    isMarked(value: Object): boolean {
        if (null === this.marked) {
            return false;
        }
        return this.data[this.marked] === value;
    }

    isDisabled(value: Object): boolean {
        if (!this.disabledField) {
            return false;
        }

        return !!value[this.disabledField];
    }

    private handleEnter() {
        if (!this.loading) {
            // try to determine marked (look if item is in list)
            if (!this.marked) {
                for (let i = 0; i < this.data.length; i++) {
                    if (this.currVal === this.getDisplayValue(this.data[i])) {
                        this.marked = i;
                        break;
                    }
                }
            }
            if (null === this.marked) {
                if (this.forceSelection) {
                    this.onSelect.emit(null);
                    this.sendModelChange(null);
                    this.clear();
                } else {
                    this.onCreate.emit(this.currVal);
                    //this may causes error
                    this.sendModelChange(this.currVal);
                }
            } else {
                let item = this.data[this.marked];
                if (this.isDisabled(item)) {
                    return;
                }
                this.onSelect.emit(this.data[this.marked]);
                this.sendModelChange(this.data[this.marked]);
            }

            if (this.clearOnSelect) {
                this.clear();
            } else {
                this.hideList = true;
            }
            if (!this.remote && !this.localFilter) {
                this.data = this._initialData;
            }
        }
        else {
            this._enterCued = true;
        }
    }

    private handleUp() {
        if (this.marked) {
            this.marked--;
        }
    }

    private handleDown() {
        if (null !== this.marked) {
            this.marked++;
        } else {
            this.marked = 0;
        }
    }

    private clear() {
        this.currVal = '';
        this.data = [];
    }

    private getDisplayValue(val: any) {
        let result: any = val;

        if (!this.displayField || !val) {
            return null;
        }

        this.displayField.split('.').forEach((index) => {
            result = result[index];
        });

        return result;
    }

    private getValueValue(val: any) {
        let result: any = val;

        if (!this.valueField || !val) {
            return val;
        }

        this.valueField.split('.').forEach((index) => {
            result = result[index];
        });

        return result;
    }

    private loadData() {
        if (!this.remote) {
            if (this.localFilter) {
                this.data = this._initialData.filter((item) => {
                    return !this.currVal ||
                        -1 !== this.getDisplayValue(item).indexOf(this.currVal);
                });
            }
        } else {
            this.loading = true;
            this.onQuery.emit(this._currVal);
        }
    }

    private sendModelChange(val: any) {
        this.propagateChange(this.getValueValue(val));
    }

    private searchValueObject(value: any): any {
        if (false === value instanceof Object && this.valueField && this._initialData) {
            this._initialData.forEach((item) => {
                if (value === this.getValueValue(item)) {
                    value = item;
                }
            });
        }
        return value;
    }

    onTriggerClick() {
        this._input.nativeElement.focus();
    }

    writeValue(value: any): void {
        value = this.searchValueObject(value);

        if (value instanceof Object && this.getDisplayValue(value)) {
            this.currVal = this.getDisplayValue(value);
        } else {
            this._tmpVal = value;
        }

        this.onInitValue.emit(value);
    }

    registerOnChange(fn: any): void {
        this.propagateChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.propagateTouch = fn;
    }
}
