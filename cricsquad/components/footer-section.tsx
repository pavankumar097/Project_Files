import { Mail, Newspaper } from "lucide-react"

export default function FooterSection() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 py-12 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Team Members */}
          <div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Team Members
            </h3>
            <ul className="space-y-2">
              <li className="font-medium">V. Raja Chowdary</li>
              <li className="text-sm text-gray-500 dark:text-gray-400">
                AM.EN.U4ELC21039
              </li>
              <li className="font-medium">A. Siddharth Reddy</li>
              <li className="text-sm text-gray-500 dark:text-gray-400">
                AM.EN.U4ELC21042
              </li>
              <li className="font-medium">M. Sohan</li>
              <li className="text-sm text-gray-500 dark:text-gray-400">
                AM.EN.U4ELC21042
              </li>
              <li className="font-medium">B.S.V.K. Pavan Kumar</li>
              <li className="text-sm text-gray-500 dark:text-gray-400">
                AM.EN.U4ELC21045
              </li>
            </ul>
          </div>

          {/* Project Guide */}
          <div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Project Guide
            </h3>
            <div className="space-y-1">
              <p className="font-medium">Dr. V Ravikumar Pandi</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Associate Professor
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dept of Electrical and Electronics Engineering
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                School of Engineering, Amritapuri
              </p>
            </div>
          </div>
        </div>

        {/* Divider + Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm">
          <p className="inline-flex items-center justify-center space-x-2">
            <Newspaper className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>Paper Name: A STACKING APPROACH FOR T20 CRICKET PERFORMANCE FORECASTING USING MACHINE LEARNING</span>
          </p>
          <p>

            <span>Publication Status: Accepted</span>
          </p>
          <p className="mt-2">&copy; 2024 CricSquad. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
