(function() {
    'use strict';

    angular
        .module('color.picker.input', [])
        .directive('colorPickerInput', colorPickerInput);

    /* @ngInject */
    function colorPickerInput($ionicModal, $timeout) {
        var directive = {
            restrict: 'E',
            replace: true,
            templateUrl: 'app/shared/directives/color-picker/color-picker-input/color-picker-input.view.html',
            scope: {
            },
            bindToController: {
                presetColors:'=',
                onlyDisplay:'=',
                inputIcon:'='
            },
            link: linkFunc,
            controller: Controller,
            controllerAs: 'cpi'
        };

        return directive;

        function linkFunc($scope, $element, $attr, $ctrl) {
            console.log($scope.onlyDisplay);
            $element[0].addEventListener('animationend', function(ev) {
                if (ev.target.classList.contains('remove-color')) {
                    $ctrl.filterOutColors();
                }
            }, true);
        }
    }

    /* @ngInject */
    function Controller($scope, $element, $ionicModal, $timeout) {
        var cpi = this;
        this.$element = $element;
        this.$scope = $scope;
        this.$timeout = $timeout;
        this.modalColorPicker = null;
        this.newColor = false;
        this.lastColor = null;
        this.inputColors = {};
        this.modalColors = {};
        this.hasColors = Object.keys(this.presetColors).length !== 0;
        if (this.hasColors) {
            this.inputColors = this.presetColors;
        }

        activate();

        function activate() {
            console.log('activate');
            if (!cpi.onlyDisplay) {

                $ionicModal.fromTemplateUrl('app/shared/directives/color-picker/color-picker.modal.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function(modal) {
                    cpi.modalColorPicker = modal;
                });

                $scope.$on('modal.shown', function(ev) {
                    if (ev.targetScope.cpi) {
                        $timeout(function() {
                            cpi.onscreen = true;
                            cpi.newColor = false;
                            cpi.lastColor = null;
                        }, 400);
                    }
                });

                $scope.$on('modal.hidden', function(ev) {
                    console.log('modal.hidden', ev.targetScope);
                    if (ev.targetScope.cpi) {
                        $timeout(function() {
                            cpi.onscreen = false;
                            cpi.inputColors = angular.copy(cpi.modalColors);
                            cpi.modalColors = null;

                            if (cpi.newColor) {
                                cpi.publishSelectedColor(cpi.lastColor);
                            }
                        }, 400);
                    }
                });
            }

            $scope.$on('color.picker.select', function(ev, data) {
                console.log('color.picker.select ' + 'event from directive ', data);
                cpi.hasColors = true;
                $timeout(function() {
                    cpi.lastColor = data;
                    cpi.newColor = true;
                    cpi.modalColorPicker.hide();
                },  100);
            });
        }
    }

    Controller.prototype.filterOutColors = function() {
        var that = this;
        var colors = {};
        angular.forEach(that.inputColors, function(status, color) {
            if (status) {
                colors[color] = status;
            }
        });

        var colorsLen = Object.keys(colors).length;
        if (colorsLen !== 0) {
            that.inputColors = angular.copy(colors);
        } else {
            that.inputColors = {};
            that.$timeout(function() {
                that.hasColors = false;
            }, 600);
        }

        that.$scope.$emit('color.picker.input.select', that.inputColors);
    };

    Controller.prototype.launchColorPicker = function() {
        if (!this.onlyDisplay) {
            this.modalColorPicker.show();
            this.modalColors = angular.copy(this.inputColors);
        }
    };

    Controller.prototype.closeColorPicker = function() {
        this.modalColorPicker.hide();
    };

    Controller.prototype.publishSelectedColor = function(color) {
        if (color) {
            this.inputColors[color] = true;
            console.log(this.inputColors);
        }

        this.$scope.$emit('color.picker.input.select', this.inputColors);
    };

})();
