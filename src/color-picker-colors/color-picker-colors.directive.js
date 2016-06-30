(function() {
    'use strict';

    angular
        .module('color.picker.colors', [])
        .directive('colorPickerColors', colorPickerColors);

    /* @ngInject */
    function colorPickerColors() {
        var directive = {
            restrict: 'E',
            replace: true,
            templateUrl: 'app/shared/directives/color-picker/color-picker-colors/color-picker-colors.view.html',
            scope: {
            },
            link: linkFunc,
            controller: Controller,
            controllerAs: 'cpc',
            bindToController: {
                colors:'='
            }
        };

        return directive;

        function linkFunc($scope, $element, $attr, $ctrl) {

        }
    }

    /* @ngInject */
    function Controller() {
        var cpc = this;
        activate();

        function activate() {

        }
    }

})();
